import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ArtStudioCategory,
  ArtStudioCategoryTranslation,
  ArtStudioOrder,
  ArtStudioProduct,
  ArtStudioProductOffer,
  ArtStudioProductOption,
  ArtStudioProductTranslation,
  ArtStudioProductType,
  ArtStudioProductTypeTranslation,
  ArtStudioPublicSettings,
  Locale,
  LocalizedArtStudioCategory,
  LocalizedArtStudioProduct,
  LocalizedArtStudioProductType
} from "@/lib/types";

const fallbackPublicSettings: ArtStudioPublicSettings = {
  id: "fallback",
  pickup_name_bg: "Art Gallery Bansko",
  pickup_name_en: "Art Gallery Bansko",
  pickup_address_bg: null,
  pickup_address_en: null,
  pickup_phone: null,
  pickup_instructions_bg: null,
  pickup_instructions_en: null,
  econt_instructions_bg: "Посочи град и предпочитан офис на Еконт.",
  econt_instructions_en: "Enter the city and preferred Econt office.",
  orders_enabled: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString()
};

async function artStudioClient(includeInactive = false) {
  return includeInactive ? createSupabaseServerClient() : createPublicSupabaseClient();
}

function localizeProductType(
  productType: ArtStudioProductType,
  translations: ArtStudioProductTypeTranslation[],
  locale: Locale
): LocalizedArtStudioProductType | null {
  const current = translations.find((translation) => translation.locale === locale);
  if (!current) return null;
  const alternate = translations.find((translation) => translation.locale !== locale);
  return { ...productType, ...current, alternate_slug: alternate?.slug ?? null };
}

function localizeCategory(
  category: ArtStudioCategory,
  translations: ArtStudioCategoryTranslation[],
  locale: Locale
): LocalizedArtStudioCategory | null {
  const current = translations.find((translation) => translation.locale === locale);
  return current ? { ...category, ...current } : null;
}

export async function getArtStudioProductTypes(options?: {
  locale?: Locale;
  includeInactive?: boolean;
}): Promise<LocalizedArtStudioProductType[]> {
  const locale = options?.locale ?? "bg";
  const supabase = await artStudioClient(options?.includeInactive);
  if (!supabase) return [];

  let query = supabase
    .from("art_studio_product_types")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (!options?.includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error || !data?.length) return [];

  const rows = data as ArtStudioProductType[];
  const { data: translationData, error: translationError } = await supabase
    .from("art_studio_product_type_translations")
    .select("*")
    .in("product_type_id", rows.map((row) => row.id));
  if (translationError) return [];

  const translations = (translationData ?? []) as ArtStudioProductTypeTranslation[];
  return rows
    .map((row) => localizeProductType(row, translations.filter((translation) => translation.product_type_id === row.id), locale))
    .filter(Boolean) as LocalizedArtStudioProductType[];
}

export async function getArtStudioCategories(options?: {
  locale?: Locale;
  includeInactive?: boolean;
  productTypeId?: string;
}): Promise<LocalizedArtStudioCategory[]> {
  const locale = options?.locale ?? "bg";
  const supabase = await artStudioClient(options?.includeInactive);
  if (!supabase) return [];

  let query = supabase.from("art_studio_categories").select("*").order("sort_order", { ascending: true });
  if (!options?.includeInactive) query = query.eq("is_active", true);
  if (options?.productTypeId) query = query.eq("product_type_id", options.productTypeId);

  const { data, error } = await query;
  if (error || !data?.length) return [];

  const rows = data as ArtStudioCategory[];
  const { data: translationData, error: translationError } = await supabase
    .from("art_studio_category_translations")
    .select("*")
    .in("category_id", rows.map((row) => row.id));
  if (translationError) return [];

  const translations = (translationData ?? []) as ArtStudioCategoryTranslation[];
  return rows
    .map((row) => localizeCategory(row, translations.filter((translation) => translation.category_id === row.id), locale))
    .filter(Boolean) as LocalizedArtStudioCategory[];
}

export async function getArtStudioProducts(options?: {
  locale?: Locale;
  includeInactive?: boolean;
  productTypeId?: string;
}): Promise<LocalizedArtStudioProduct[]> {
  const locale = options?.locale ?? "bg";
  const supabase = await artStudioClient(options?.includeInactive);
  if (!supabase) return [];

  let query = supabase
    .from("art_studio_products")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (!options?.includeInactive) query = query.eq("is_active", true);
  if (options?.productTypeId) query = query.eq("product_type_id", options.productTypeId);

  const { data, error } = await query;
  if (error || !data?.length) return [];

  const products = data as ArtStudioProduct[];
  const productIds = products.map((product) => product.id);
  const [translationResult, optionResult, offerResult, productTypes, categories] = await Promise.all([
    supabase.from("art_studio_product_translations").select("*").in("product_id", productIds),
    supabase.from("art_studio_product_options").select("*").in("product_id", productIds).order("sort_order", { ascending: true }),
    supabase.from("art_studio_product_offers").select("*").in("product_id", productIds).order("sort_order", { ascending: true }),
    getArtStudioProductTypes({ locale, includeInactive: options?.includeInactive }),
    getArtStudioCategories({ locale, includeInactive: options?.includeInactive })
  ]);

  if (translationResult.error || optionResult.error || offerResult.error) return [];

  const translations = (translationResult.data ?? []) as ArtStudioProductTranslation[];
  const productOptions = (optionResult.data ?? []) as ArtStudioProductOption[];
  const offers = (offerResult.data ?? []) as ArtStudioProductOffer[];
  const typeById = new Map(productTypes.map((productType) => [productType.id, productType]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return products.flatMap((product) => {
    const current = translations.find((translation) => translation.product_id === product.id && translation.locale === locale);
    const alternate = translations.find((translation) => translation.product_id === product.id && translation.locale !== locale);
    const productType = typeById.get(product.product_type_id);
    if (!current || !productType) return [];

    return [{
      ...product,
      ...current,
      alternate_slug: alternate?.slug ?? null,
      product_type: productType,
      category: product.category_id ? categoryById.get(product.category_id) ?? null : null,
      options: productOptions.filter((option) => option.product_id === product.id),
      offers: offers.filter((offer) => offer.product_id === product.id && (options?.includeInactive || offer.is_active))
    }];
  });
}

export async function getArtStudioTypeBySlug(slug: string, locale: Locale) {
  const productTypes = await getArtStudioProductTypes({ locale });
  return productTypes.find((productType) => productType.slug === slug) ?? null;
}

export async function getArtStudioProductBySlugs(typeSlug: string, productSlug: string, locale: Locale) {
  const productType = await getArtStudioTypeBySlug(typeSlug, locale);
  if (!productType) return null;
  const products = await getArtStudioProducts({ locale, productTypeId: productType.id });
  return products.find((product) => product.slug === productSlug) ?? null;
}

export async function getArtStudioPublicSettings(options?: { includeAdmin?: boolean }) {
  const supabase = await artStudioClient(options?.includeAdmin);
  if (!supabase) return fallbackPublicSettings;
  const { data, error } = await supabase.from("art_studio_public_settings").select("*").limit(1).maybeSingle();
  return error || !data ? fallbackPublicSettings : (data as ArtStudioPublicSettings);
}

export async function getArtStudioOrders(): Promise<ArtStudioOrder[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("art_studio_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return error ? [] : ((data ?? []) as ArtStudioOrder[]);
}
