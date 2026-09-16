import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { businessMediaUrls, type BusinessMediaUrls } from "@/lib/business-platform/media";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type {
  BusinessMedia,
  BusinessMenuAvailability,
  BusinessMenuCategory,
  BusinessMenuCategoryTranslation,
  BusinessMenuItem,
  BusinessMenuItemTranslation,
  BusinessMenuItemVariant,
  BusinessMenuItemVariantTranslation,
  Database,
  Locale
} from "@/lib/types";

/**
 * Единственото меню. Профилът, QR менюто, телевизорите и печатът извикват
 * getBusinessMenu() и само го рисуват различно. Тук се решават и правилата,
 * които не бива да се повтарят на четири места: липсващ превод → български;
 * артикул с варианти няма собствена цена; скритото не излиза публично.
 */

type LocalizedText = { bg?: string | null; en?: string | null };

export type MenuVariant = {
  id: string;
  name: string;
  names: LocalizedText;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  names: LocalizedText;
  description: string | null;
  descriptions: LocalizedText;
  priceCents: number | null;
  variants: MenuVariant[];
  availability: BusinessMenuAvailability;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
  allergens: string[];
  media: (BusinessMediaUrls & { id: string; alt: string | null; width: number | null; height: number | null }) | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  names: LocalizedText;
  description: string | null;
  descriptions: LocalizedText;
  isActive: boolean;
  sortOrder: number;
  items: MenuItem[];
};

export type BusinessMenu = {
  locale: Locale;
  categories: MenuCategory[];
};

type Client = SupabaseClient<Database>;

function pickText(texts: LocalizedText, locale: Locale) {
  return (locale === "en" ? texts.en : texts.bg) || texts.bg || texts.en || "";
}

function pickDescription(texts: LocalizedText, locale: Locale) {
  const value = (locale === "en" ? texts.en : texts.bg) || texts.bg || null;
  return value && value.trim() ? value : null;
}

export async function getBusinessMenu(
  supabase: Client,
  businessId: string,
  options: { locale?: Locale; includeHidden?: boolean; categoryIds?: string[] } = {}
): Promise<BusinessMenu> {
  const locale = options.locale ?? "bg";
  const includeHidden = options.includeHidden ?? false;

  const [categories, categoryTexts, items, itemTexts, variants, variantTexts] = await Promise.all([
    supabase.from("business_menu_categories").select("id, sort_order, is_active").eq("business_id", businessId).order("sort_order"),
    supabase.from("business_menu_category_translations").select("category_id, locale, name, description").eq("business_id", businessId),
    supabase
      .from("business_menu_items")
      .select("id, category_id, price_cents, availability, is_active, sort_order, media_id, tags, allergens")
      .eq("business_id", businessId)
      .order("sort_order"),
    supabase.from("business_menu_item_translations").select("item_id, locale, name, description").eq("business_id", businessId),
    supabase.from("business_menu_item_variants").select("id, item_id, price_cents, is_active, sort_order").eq("business_id", businessId).order("sort_order"),
    supabase.from("business_menu_item_variant_translations").select("variant_id, locale, name").eq("business_id", businessId)
  ]);

  const mediaIds = (items.data ?? []).map((item) => item.media_id).filter((id): id is string => Boolean(id));
  const media = mediaIds.length
    ? await supabase.from("business_media").select("id, original_key, variant_keys, alt, width, height, media_type").in("id", mediaIds)
    : { data: [] as Pick<BusinessMedia, "id" | "original_key" | "variant_keys" | "alt" | "width" | "height" | "media_type">[] };

  const mediaById = new Map((media.data ?? []).map((row) => [row.id, row]));

  const categoryTextsById = groupTexts(categoryTexts.data ?? [], (row) => row.category_id);
  const itemTextsById = groupTexts(itemTexts.data ?? [], (row) => row.item_id);
  const variantTextsById = groupTexts(variantTexts.data ?? [], (row) => row.variant_id);

  const variantsByItem = new Map<string, MenuVariant[]>();
  for (const variant of variants.data ?? []) {
    if (!includeHidden && !variant.is_active) continue;
    const texts = variantTextsById.get(variant.id) ?? emptyTexts();
    const list = variantsByItem.get(variant.item_id) ?? [];
    list.push({
      id: variant.id,
      name: pickText(texts.names, locale),
      names: texts.names,
      priceCents: variant.price_cents,
      isActive: variant.is_active,
      sortOrder: variant.sort_order
    });
    variantsByItem.set(variant.item_id, list);
  }

  const itemsByCategory = new Map<string, MenuItem[]>();
  for (const item of items.data ?? []) {
    if (!includeHidden && !item.is_active) continue;
    const texts = itemTextsById.get(item.id) ?? emptyTexts();
    const mediaRow = item.media_id ? mediaById.get(item.media_id) : null;
    const list = itemsByCategory.get(item.category_id) ?? [];
    list.push({
      id: item.id,
      categoryId: item.category_id,
      name: pickText(texts.names, locale),
      names: texts.names,
      description: pickDescription(texts.descriptions, locale),
      descriptions: texts.descriptions,
      priceCents: item.price_cents,
      variants: variantsByItem.get(item.id) ?? [],
      availability: item.availability,
      isActive: item.is_active,
      sortOrder: item.sort_order,
      tags: item.tags ?? [],
      allergens: item.allergens ?? [],
      media:
        mediaRow && mediaRow.media_type === "image"
          ? { id: mediaRow.id, alt: mediaRow.alt, width: mediaRow.width, height: mediaRow.height, ...businessMediaUrls(mediaRow) }
          : null
    });
    itemsByCategory.set(item.category_id, list);
  }

  const wanted = options.categoryIds ? new Set(options.categoryIds) : null;

  const result: MenuCategory[] = [];
  for (const category of categories.data ?? []) {
    if (!includeHidden && !category.is_active) continue;
    if (wanted && !wanted.has(category.id)) continue;
    const texts = categoryTextsById.get(category.id) ?? emptyTexts();
    result.push({
      id: category.id,
      name: pickText(texts.names, locale),
      names: texts.names,
      description: pickDescription(texts.descriptions, locale),
      descriptions: texts.descriptions,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      items: itemsByCategory.get(category.id) ?? []
    });
  }

  return { locale, categories: result };
}

type Texts = { names: LocalizedText; descriptions: LocalizedText };

function emptyTexts(): Texts {
  return { names: {}, descriptions: {} };
}

function groupTexts<T extends { locale: Locale; name: string; description?: string | null }>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, Texts>();
  for (const row of rows) {
    const entry = map.get(key(row)) ?? { names: {}, descriptions: {} };
    entry.names[row.locale] = row.name;
    entry.descriptions[row.locale] = row.description ?? null;
    map.set(key(row), entry);
  }
  return map;
}

/** Обобщение на цената за списъци: „3,90“ или „от 2,90“ при варианти. */
export function priceSummary(item: Pick<MenuItem, "priceCents" | "variants">) {
  if (item.variants.length > 0) {
    const active = item.variants.filter((variant) => variant.isActive);
    const pool = active.length ? active : item.variants;
    return { kind: "variants" as const, minCents: Math.min(...pool.map((variant) => variant.priceCents)), count: pool.length };
  }

  return { kind: "single" as const, cents: item.priceCents };
}

/* Редакция: суровите редове с двата езика, за формите в портала. */

export type MenuCategoryForEdit = BusinessMenuCategory & { translations: BusinessMenuCategoryTranslation[] };

export type MenuItemForEdit = BusinessMenuItem & {
  translations: BusinessMenuItemTranslation[];
  variants: (BusinessMenuItemVariant & { translations: BusinessMenuItemVariantTranslation[] })[];
  media: BusinessMedia | null;
};

export async function getMenuCategoryForEdit(supabase: Client, businessId: string, categoryId: string): Promise<MenuCategoryForEdit | null> {
  const [{ data: category }, { data: translations }] = await Promise.all([
    supabase.from("business_menu_categories").select("*").eq("business_id", businessId).eq("id", categoryId).maybeSingle(),
    supabase.from("business_menu_category_translations").select("*").eq("business_id", businessId).eq("category_id", categoryId)
  ]);

  return category ? { ...category, translations: translations ?? [] } : null;
}

export async function getMenuItemForEdit(supabase: Client, businessId: string, itemId: string): Promise<MenuItemForEdit | null> {
  const [{ data: item }, { data: translations }, { data: variants }, { data: variantTranslations }] = await Promise.all([
    supabase.from("business_menu_items").select("*").eq("business_id", businessId).eq("id", itemId).maybeSingle(),
    supabase.from("business_menu_item_translations").select("*").eq("business_id", businessId).eq("item_id", itemId),
    supabase.from("business_menu_item_variants").select("*").eq("business_id", businessId).eq("item_id", itemId).order("sort_order"),
    supabase.from("business_menu_item_variant_translations").select("*").eq("business_id", businessId)
  ]);

  if (!item) {
    return null;
  }

  const { data: media } = item.media_id
    ? await supabase.from("business_media").select("*").eq("id", item.media_id).maybeSingle()
    : { data: null };

  return {
    ...item,
    translations: translations ?? [],
    variants: (variants ?? []).map((variant) => ({
      ...variant,
      translations: (variantTranslations ?? []).filter((row) => row.variant_id === variant.id)
    })),
    media: media ?? null
  };
}

export type MenuCategoryOption = { id: string; name: string; isActive: boolean };

export async function getMenuCategoryOptions(supabase: Client, businessId: string): Promise<MenuCategoryOption[]> {
  const [{ data: categories }, { data: translations }] = await Promise.all([
    supabase.from("business_menu_categories").select("id, sort_order, is_active").eq("business_id", businessId).order("sort_order"),
    supabase.from("business_menu_category_translations").select("category_id, locale, name").eq("business_id", businessId).eq("locale", "bg")
  ]);

  const names = new Map((translations ?? []).map((row) => [row.category_id, row.name]));
  return (categories ?? []).map((category) => ({ id: category.id, name: names.get(category.id) ?? "Без име", isActive: category.is_active }));
}

/**
 * Кои бизнеси имат публично меню - за картата на сайта. Проверка „включен ли е
 * модулът“ няма и тук: политиките пускат само активното на активен бизнес с
 * включено меню, така че празен резултат е самият отговор.
 */
export async function getBusinessIdsWithPublicMenu(): Promise<Set<string>> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return new Set();
  }

  const { data } = await supabase.from("business_menu_items").select("business_id").limit(2000);
  return new Set((data ?? []).map((row) => row.business_id));
}
