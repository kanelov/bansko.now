"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  deleteBusinessMedia,
  finalizeBusinessImage
} from "@/lib/business-platform/media";
import { menuCategoryIconOptions } from "@/lib/business-platform/menu-icons";
import { parsePriceToCents } from "@/lib/business-platform/money";
import { revalidateBusinessPublic } from "@/lib/business-platform/revalidate";
import type { BusinessMenuAvailability } from "@/lib/types";

/**
 * Всички записи по менюто минават оттук. Първият ред на всяко действие е
 * requireBusinessOwner(); клиентът е с бисквитки, така че RLS важи и втора
 * стена спира всичко, което кодът би пропуснал.
 */

const menuPath = "/business/menu";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function stringValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => (typeof value === "string" ? value.trim() : ""));
}

function boolValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "1" || value === "true";
}

function idValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return uuidPattern.test(value) ? value : null;
}

/** „Веган, без глутен“ → ["Веган", "без глутен"]; най-много 20 етикета до 40 знака. */
function listValue(formData: FormData, key: string) {
  return Array.from(
    new Set(
      stringValue(formData, key)
        .split(/[,\n;]/)
        .map((item) => item.trim().slice(0, 40))
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function withError(path: string, code: string) {
  return `${path}${path.includes("?") ? "&" : "?"}error=${code}`;
}

type OwnerClient = Awaited<ReturnType<typeof requireBusinessOwner>>["supabase"];

/** Новият ред отива най-отдолу: най-големият sort_order + 10. */
async function nextCategorySortOrder(supabase: OwnerClient, businessId: string) {
  const { data } = await supabase
    .from("business_menu_categories")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? 0) + 10;
}

async function nextItemSortOrder(supabase: OwnerClient, businessId: string, categoryId: string) {
  const { data } = await supabase
    .from("business_menu_items")
    .select("sort_order")
    .eq("business_id", businessId)
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? 0) + 10;
}

/* ------------------------------------------------------------------------ */
/* Категории                                                                 */
/* ------------------------------------------------------------------------ */

export async function saveMenuCategoryAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const formPath = id ? `${menuPath}/categories/${id}` : `${menuPath}/categories/new`;

  const nameBg = stringValue(formData, "name_bg").slice(0, 80);
  const nameEn = stringValue(formData, "name_en").slice(0, 80);
  const descriptionBg = stringValue(formData, "description_bg").slice(0, 300);
  const descriptionEn = stringValue(formData, "description_en").slice(0, 300);
  const isActive = boolValue(formData, "is_active");
  const iconValue = stringValue(formData, "icon_name");
  const iconName = menuCategoryIconOptions.some((option) => option.name === iconValue) ? iconValue : null;

  if (!nameBg) {
    redirect(withError(formPath, "name"));
  }

  let categoryId = id;

  if (categoryId) {
    const { error } = await supabase
      .from("business_menu_categories")
      .update({ is_active: isActive, icon_name: iconName })
      .eq("id", categoryId)
      .eq("business_id", business.businessId);

    if (error) {
      redirect(withError(formPath, "save"));
    }
  } else {
    const { data, error } = await supabase
      .from("business_menu_categories")
      .insert({
        business_id: business.businessId,
        is_active: isActive,
        icon_name: iconName,
        sort_order: await nextCategorySortOrder(supabase, business.businessId)
      })
      .select("id")
      .single();

    if (error || !data) {
      redirect(withError(formPath, "save"));
    }

    categoryId = data.id;
  }

  const { error: bgError } = await supabase
    .from("business_menu_category_translations")
    .upsert(
      { category_id: categoryId, business_id: business.businessId, locale: "bg", name: nameBg, description: descriptionBg || null },
      { onConflict: "category_id,locale" }
    );

  if (bgError) {
    redirect(withError(formPath, "save"));
  }

  if (nameEn) {
    await supabase
      .from("business_menu_category_translations")
      .upsert(
        { category_id: categoryId, business_id: business.businessId, locale: "en", name: nameEn, description: descriptionEn || null },
        { onConflict: "category_id,locale" }
      );
  } else {
    await supabase.from("business_menu_category_translations").delete().eq("category_id", categoryId).eq("locale", "en");
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}?saved=category`);
}

export async function deleteMenuCategoryAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");

  if (!id) {
    redirect(withError(menuPath, "missing"));
  }

  /* Снимките на артикулите в категорията не се трият сами от R2 - редовете да. */
  const { data: items } = await supabase
    .from("business_menu_items")
    .select("media_id")
    .eq("business_id", business.businessId)
    .eq("category_id", id);

  const { error } = await supabase.from("business_menu_categories").delete().eq("id", id).eq("business_id", business.businessId);

  if (error) {
    redirect(withError(menuPath, "delete"));
  }

  for (const item of items ?? []) {
    if (item.media_id) {
      await deleteBusinessMedia(supabase, business.businessId, item.media_id).catch(() => undefined);
    }
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}?saved=deleted`);
}

export async function moveMenuCategoryAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const direction = stringValue(formData, "direction") === "up" ? -1 : 1;

  const { data: rows } = await supabase
    .from("business_menu_categories")
    .select("id, sort_order")
    .eq("business_id", business.businessId)
    .order("sort_order")
    .order("created_at");

  await applyMove(rows ?? [], id, direction, async (rowId, sortOrder) => {
    await supabase.from("business_menu_categories").update({ sort_order: sortOrder }).eq("id", rowId).eq("business_id", business.businessId);
  });

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(menuPath);
}

/**
 * Мести ред с една позиция и презаписва подредбата през 10, за да няма
 * равни номера (новите редове идват с еднакъв sort_order по подразбиране).
 */
async function applyMove(
  rows: { id: string; sort_order: number }[],
  id: string | null,
  direction: -1 | 1,
  write: (id: string, sortOrder: number) => Promise<void>
) {
  const index = rows.findIndex((row) => row.id === id);
  const target = index + direction;

  if (index === -1 || target < 0 || target >= rows.length) {
    return;
  }

  const order = rows.map((row) => row.id);
  [order[index], order[target]] = [order[target], order[index]];

  for (const [position, rowId] of order.entries()) {
    const sortOrder = (position + 1) * 10;
    const current = rows.find((row) => row.id === rowId);
    if (current && current.sort_order !== sortOrder) {
      await write(rowId, sortOrder);
    }
  }
}

/* ------------------------------------------------------------------------ */
/* Артикули                                                                  */
/* ------------------------------------------------------------------------ */

type VariantInput = { id: string | null; nameBg: string; nameEn: string; priceCents: number; isActive: boolean };

function readVariants(formData: FormData): { variants: VariantInput[]; error: string | null } {
  const ids = stringValues(formData, "variant_id");
  const namesBg = stringValues(formData, "variant_name_bg");
  const namesEn = stringValues(formData, "variant_name_en");
  const prices = stringValues(formData, "variant_price");
  const actives = stringValues(formData, "variant_active");
  const variants: VariantInput[] = [];

  for (const [index, nameBg] of namesBg.entries()) {
    const priceRaw = prices[index] ?? "";
    if (!nameBg && !priceRaw) continue; // празен ред

    const priceCents = parsePriceToCents(priceRaw);
    if (!nameBg) return { variants: [], error: "variant-name" };
    if (priceCents === null || Number.isNaN(priceCents)) return { variants: [], error: "variant-price" };

    variants.push({
      id: uuidPattern.test(ids[index] ?? "") ? ids[index] : null,
      nameBg: nameBg.slice(0, 60),
      nameEn: (namesEn[index] ?? "").slice(0, 60),
      priceCents,
      isActive: actives[index] !== "0"
    });
  }

  return { variants: variants.slice(0, 8), error: null };
}

export async function saveMenuItemAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const categoryId = idValue(formData, "category_id");
  const formPath = id ? `${menuPath}/items/${id}` : `${menuPath}/items/new${categoryId ? `?category=${categoryId}` : ""}`;

  const nameBg = stringValue(formData, "name_bg").slice(0, 120);
  const nameEn = stringValue(formData, "name_en").slice(0, 120);
  const descriptionBg = stringValue(formData, "description_bg").slice(0, 500);
  const descriptionEn = stringValue(formData, "description_en").slice(0, 500);
  const hasVariants = boolValue(formData, "has_variants");
  const availability: BusinessMenuAvailability = stringValue(formData, "availability") === "sold_out" ? "sold_out" : "available";
  const isActive = boolValue(formData, "is_active");
  const tags = listValue(formData, "tags");
  const allergens = listValue(formData, "allergens");
  const mediaId = idValue(formData, "media_id");

  if (!nameBg) redirect(withError(formPath, "name"));
  if (!categoryId) redirect(withError(formPath, "category"));

  const { data: category } = await supabase
    .from("business_menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", business.businessId)
    .maybeSingle();
  if (!category) redirect(withError(formPath, "category"));

  if (mediaId) {
    const { data: media } = await supabase.from("business_media").select("id").eq("id", mediaId).eq("business_id", business.businessId).maybeSingle();
    if (!media) redirect(withError(formPath, "media"));
  }

  let priceCents: number | null = null;
  let variants: VariantInput[] = [];

  if (hasVariants) {
    const read = readVariants(formData);
    if (read.error) redirect(withError(formPath, read.error));
    if (read.variants.length === 0) redirect(withError(formPath, "variant-name"));
    variants = read.variants;
  } else {
    priceCents = parsePriceToCents(stringValue(formData, "price"));
    if (priceCents === null || Number.isNaN(priceCents)) redirect(withError(formPath, "price"));
  }

  let itemId = id;

  if (itemId) {
    /* Първо се махат вариантите, които вече ги няма, после цената: тригерът
       не пуска цена при налични варианти. */
    const keepIds = variants.map((variant) => variant.id).filter((value): value is string => Boolean(value));
    let removal = supabase.from("business_menu_item_variants").delete().eq("item_id", itemId).eq("business_id", business.businessId);
    if (keepIds.length) {
      removal = removal.not("id", "in", `(${keepIds.join(",")})`);
    }
    await removal;

    const { error } = await supabase
      .from("business_menu_items")
      .update({ category_id: categoryId, price_cents: priceCents, availability, is_active: isActive, tags, allergens, media_id: mediaId })
      .eq("id", itemId)
      .eq("business_id", business.businessId);

    if (error) redirect(withError(formPath, "save"));
  } else {
    const { data, error } = await supabase
      .from("business_menu_items")
      .insert({
        business_id: business.businessId,
        category_id: categoryId,
        price_cents: priceCents,
        availability,
        is_active: isActive,
        tags,
        allergens,
        media_id: mediaId,
        sort_order: await nextItemSortOrder(supabase, business.businessId, categoryId)
      })
      .select("id")
      .single();

    if (error || !data) redirect(withError(formPath, "save"));
    itemId = data.id;
  }

  const { error: bgError } = await supabase
    .from("business_menu_item_translations")
    .upsert(
      { item_id: itemId, business_id: business.businessId, locale: "bg", name: nameBg, description: descriptionBg || null },
      { onConflict: "item_id,locale" }
    );
  if (bgError) redirect(withError(formPath, "save"));

  if (nameEn) {
    await supabase
      .from("business_menu_item_translations")
      .upsert(
        { item_id: itemId, business_id: business.businessId, locale: "en", name: nameEn, description: descriptionEn || null },
        { onConflict: "item_id,locale" }
      );
  } else {
    await supabase.from("business_menu_item_translations").delete().eq("item_id", itemId).eq("locale", "en");
  }

  for (const [index, variant] of variants.entries()) {
    let variantId = variant.id;
    const sortOrder = (index + 1) * 10;

    if (variantId) {
      const { error } = await supabase
        .from("business_menu_item_variants")
        .update({ price_cents: variant.priceCents, is_active: variant.isActive, sort_order: sortOrder })
        .eq("id", variantId)
        .eq("business_id", business.businessId);
      if (error) redirect(withError(formPath, "save"));
    } else {
      const { data, error } = await supabase
        .from("business_menu_item_variants")
        .insert({ item_id: itemId, business_id: business.businessId, price_cents: variant.priceCents, is_active: variant.isActive, sort_order: sortOrder })
        .select("id")
        .single();
      if (error || !data) redirect(withError(formPath, "save"));
      variantId = data.id;
    }

    await supabase
      .from("business_menu_item_variant_translations")
      .upsert({ variant_id: variantId, business_id: business.businessId, locale: "bg", name: variant.nameBg }, { onConflict: "variant_id,locale" });

    if (variant.nameEn) {
      await supabase
        .from("business_menu_item_variant_translations")
        .upsert({ variant_id: variantId, business_id: business.businessId, locale: "en", name: variant.nameEn }, { onConflict: "variant_id,locale" });
    } else {
      await supabase.from("business_menu_item_variant_translations").delete().eq("variant_id", variantId).eq("locale", "en");
    }
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}?saved=item`);
}

export async function deleteMenuItemAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");

  if (!id) redirect(withError(menuPath, "missing"));

  const { data: item } = await supabase.from("business_menu_items").select("media_id").eq("id", id).eq("business_id", business.businessId).maybeSingle();
  const { error } = await supabase.from("business_menu_items").delete().eq("id", id).eq("business_id", business.businessId);

  if (error) redirect(withError(menuPath, "delete"));

  if (item?.media_id) {
    await deleteBusinessMedia(supabase, business.businessId, item.media_id).catch(() => undefined);
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}?saved=deleted`);
}

export async function setMenuItemAvailabilityAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const availability: BusinessMenuAvailability = stringValue(formData, "availability") === "sold_out" ? "sold_out" : "available";

  if (id) {
    await supabase.from("business_menu_items").update({ availability }).eq("id", id).eq("business_id", business.businessId);
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}#item-${id}`);
}

export async function setMenuItemVisibilityAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const isActive = boolValue(formData, "is_active");

  if (id) {
    await supabase.from("business_menu_items").update({ is_active: isActive }).eq("id", id).eq("business_id", business.businessId);
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}#item-${id}`);
}

export async function moveMenuItemAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const categoryId = idValue(formData, "category_id");
  const direction = stringValue(formData, "direction") === "up" ? -1 : 1;

  if (!id || !categoryId) redirect(menuPath);

  const { data: rows } = await supabase
    .from("business_menu_items")
    .select("id, sort_order")
    .eq("business_id", business.businessId)
    .eq("category_id", categoryId)
    .order("sort_order")
    .order("created_at");

  await applyMove(rows ?? [], id, direction, async (rowId, sortOrder) => {
    await supabase.from("business_menu_items").update({ sort_order: sortOrder }).eq("id", rowId).eq("business_id", business.businessId);
  });

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(menuPath);
  redirect(`${menuPath}#item-${id}`);
}

/* ------------------------------------------------------------------------ */
/* Снимка на артикул: викат се от клиентския компонент, не от форма          */
/* ------------------------------------------------------------------------ */

type UploadTicket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createMenuImageUploadAction(input: { contentType: string; bytes: number }): Promise<UploadTicket> {
  const { business } = await requireBusinessOwner();

  if (!businessMediaConfigured()) {
    return { ok: false, error: "Хранилището за снимки не е настроено." };
  }

  try {
    const ticket = await createBusinessUploadTicket({
      businessId: business.businessId,
      contentType: String(input.contentType || ""),
      bytes: Number(input.bytes),
      mediaType: "image"
    });
    return { ok: true, ...ticket };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Неуспешна заявка за качване." };
  }
}

type FinalizeResult = { ok: true; id: string; url: string | null } | { ok: false; error: string };

export async function finalizeMenuImageAction(input: { key: string; alt?: string }): Promise<FinalizeResult> {
  const { supabase, business } = await requireBusinessOwner();

  try {
    const media = await finalizeBusinessImage({
      supabase,
      businessId: business.businessId,
      key: String(input.key || ""),
      kind: "item",
      alt: input.alt ?? null
    });
    return { ok: true, id: media.id, url: businessMediaUrls(media).w480 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Обработката на снимката не успя." };
  }
}

export async function deleteMenuImageAction(input: { id: string }): Promise<{ ok: boolean; error?: string }> {
  const { supabase, business } = await requireBusinessOwner();

  if (!uuidPattern.test(String(input.id || ""))) {
    return { ok: false, error: "Невалидна снимка." };
  }

  try {
    await deleteBusinessMedia(supabase, business.businessId, input.id);
    await revalidateBusinessPublic(supabase, business.businessId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Изтриването не успя." };
  }
}
