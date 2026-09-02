"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { landingSectionKeys, landingTextKeys, parseFaqLines, parsePairLines, parseParagraphs, parseTrustLines, typeSectionKeys, typeTextKeys } from "@/lib/art-studio-copy";
import { requireAdmin } from "@/lib/supabase/auth";
import type {
  ArtStudioOptionValue,
  ArtStudioPaymentStatus,
  ArtStudioProductionStatus,
  ArtStudioProductOffer,
  ArtStudioProductOption,
  Json,
  Locale
} from "@/lib/types";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function integerValue(formData: FormData, key: string, fallback = 100) {
  const parsed = Number.parseInt(stringValue(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function uuidValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function safeHttpsUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseArray<T>(formData: FormData, key: string): T[] {
  try {
    const value = JSON.parse(stringValue(formData, key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function revalidateArtStudio() {
  revalidatePath("/art-studio", "layout");
  revalidatePath("/en/art-studio", "layout");
  revalidatePath("/admin/art-studio", "layout");
  revalidatePath("/sitemap.xml");
}

export async function upsertArtStudioProductTypeAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const titleBg = stringValue(formData, "title_bg");
  const titleEn = stringValue(formData, "title_en") || titleBg;
  if (!titleBg) redirect("/admin/art-studio/products?error=missing-type-title");

  let formConfig: Record<string, unknown> | undefined;
  const formConfigJson = stringValue(formData, "form_config_json");
  if (formConfigJson) {
    try {
      const parsed = JSON.parse(formConfigJson) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Формата за поръчка трябва да е JSON обект.");
      formConfig = parsed as Record<string, unknown>;
    } catch (error) {
      redirect(`/admin/art-studio/products?error=${encodeURIComponent(error instanceof Error ? error.message : "Невалиден JSON за формата за поръчка.")}`);
    }
  }

  const basePayload = {
    internal_name: stringValue(formData, "internal_name") || slugify(titleEn || titleBg),
    icon_name: stringValue(formData, "icon_name") || null,
    image_url: safeHttpsUrl(stringValue(formData, "image_url")),
    gallery_urls: lines(stringValue(formData, "gallery_urls")).map(safeHttpsUrl).filter(Boolean) as string[],
    is_featured: booleanValue(formData, "is_featured"),
    is_active: booleanValue(formData, "is_active"),
    sort_order: integerValue(formData, "sort_order"),
    ...(formConfig ? { form_config: formConfig as Json } : {})
  };

  const result = id
    ? await supabase.from("art_studio_product_types").update(basePayload).eq("id", id).select("id").single()
    : await supabase.from("art_studio_product_types").insert(basePayload).select("id").single();
  if (result.error || !result.data?.id) {
    redirect(`/admin/art-studio/products?error=${encodeURIComponent(result.error?.message || "type-save-failed")}`);
  }

  const productTypeId = result.data.id;
  const translations = (["bg", "en"] as Locale[]).map((locale) => {
    const suffix = locale === "bg" ? "bg" : "en";
    const title = locale === "bg" ? titleBg : titleEn;
    return {
      product_type_id: productTypeId,
      locale,
      title,
      slug: stringValue(formData, `slug_${suffix}`) || slugify(title),
      description: stringValue(formData, `description_${suffix}`) || null,
      content: stringValue(formData, `content_${suffix}`) || null,
      image_alt: stringValue(formData, `image_alt_${suffix}`) || title,
      seo_title: stringValue(formData, `seo_title_${suffix}`) || null,
      seo_description: stringValue(formData, `seo_description_${suffix}`) || null,
      og_title: stringValue(formData, `og_title_${suffix}`) || null,
      og_description: stringValue(formData, `og_description_${suffix}`) || null,
      og_image_url: safeHttpsUrl(stringValue(formData, `og_image_url_${suffix}`)),
      robots_index: booleanValue(formData, `robots_index_${suffix}`),
      robots_follow: booleanValue(formData, `robots_follow_${suffix}`)
    };
  });
  const { error } = await supabase
    .from("art_studio_product_type_translations")
    .upsert(translations, { onConflict: "product_type_id,locale" });
  if (error) redirect(`/admin/art-studio/products?error=${encodeURIComponent(error.message)}`);

  revalidateArtStudio();
  redirect("/admin/art-studio/products?saved=type");
}

export async function upsertArtStudioCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const productTypeId = uuidValue(formData, "product_type_id");
  const titleBg = stringValue(formData, "title_bg");
  const titleEn = stringValue(formData, "title_en") || titleBg;
  if (!productTypeId || !titleBg) redirect("/admin/art-studio/products?error=missing-category-fields");

  const basePayload = {
    product_type_id: productTypeId,
    internal_name: stringValue(formData, "internal_name") || slugify(titleEn || titleBg),
    icon_name: stringValue(formData, "icon_name") || null,
    image_url: safeHttpsUrl(stringValue(formData, "image_url")),
    is_active: booleanValue(formData, "is_active"),
    sort_order: integerValue(formData, "sort_order")
  };
  const result = id
    ? await supabase.from("art_studio_categories").update(basePayload).eq("id", id).select("id").single()
    : await supabase.from("art_studio_categories").insert(basePayload).select("id").single();
  if (result.error || !result.data?.id) {
    redirect(`/admin/art-studio/products?error=${encodeURIComponent(result.error?.message || "category-save-failed")}`);
  }

  const categoryId = result.data.id;
  const translations = (["bg", "en"] as Locale[]).map((locale) => {
    const suffix = locale === "bg" ? "bg" : "en";
    const title = locale === "bg" ? titleBg : titleEn;
    return {
      category_id: categoryId,
      locale,
      title,
      slug: stringValue(formData, `slug_${suffix}`) || slugify(title),
      description: stringValue(formData, `description_${suffix}`) || null,
      image_alt: stringValue(formData, `image_alt_${suffix}`) || title,
      seo_title: stringValue(formData, `seo_title_${suffix}`) || null,
      seo_description: stringValue(formData, `seo_description_${suffix}`) || null,
      robots_index: booleanValue(formData, `robots_index_${suffix}`),
      robots_follow: booleanValue(formData, `robots_follow_${suffix}`)
    };
  });
  const { error } = await supabase
    .from("art_studio_category_translations")
    .upsert(translations, { onConflict: "category_id,locale" });
  if (error) redirect(`/admin/art-studio/products?error=${encodeURIComponent(error.message)}`);

  revalidateArtStudio();
  redirect("/admin/art-studio/products?saved=category");
}

export async function upsertArtStudioProductAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const productTypeId = uuidValue(formData, "product_type_id");
  const categoryId = uuidValue(formData, "category_id");
  const titleBg = stringValue(formData, "title_bg");
  const titleEn = stringValue(formData, "title_en") || titleBg;
  if (!productTypeId || !titleBg) redirect("/admin/art-studio/products?error=missing-product-fields");

  const basePayload = {
    product_type_id: productTypeId,
    category_id: categoryId,
    sku: stringValue(formData, "sku") || null,
    image_url: safeHttpsUrl(stringValue(formData, "image_url")),
    gallery_urls: lines(stringValue(formData, "gallery_urls")).map(safeHttpsUrl).filter(Boolean) as string[],
    personalization_text_enabled: booleanValue(formData, "personalization_text_enabled"),
    idea_note_enabled: booleanValue(formData, "idea_note_enabled"),
    is_featured: booleanValue(formData, "is_featured"),
    is_active: booleanValue(formData, "is_active"),
    sort_order: integerValue(formData, "sort_order")
  };
  const result = id
    ? await supabase.from("art_studio_products").update(basePayload).eq("id", id).select("id").single()
    : await supabase.from("art_studio_products").insert(basePayload).select("id").single();
  if (result.error || !result.data?.id) {
    redirect(`/admin/art-studio/products?error=${encodeURIComponent(result.error?.message || "product-save-failed")}`);
  }

  const productId = result.data.id;
  const translations = (["bg", "en"] as Locale[]).map((locale) => {
    const suffix = locale === "bg" ? "bg" : "en";
    const title = locale === "bg" ? titleBg : titleEn;
    return {
      product_id: productId,
      locale,
      title,
      slug: stringValue(formData, `slug_${suffix}`) || slugify(title),
      short_description: stringValue(formData, `short_description_${suffix}`) || null,
      description: stringValue(formData, `description_${suffix}`) || null,
      image_alt: stringValue(formData, `image_alt_${suffix}`) || title,
      seo_title: stringValue(formData, `seo_title_${suffix}`) || null,
      seo_description: stringValue(formData, `seo_description_${suffix}`) || null,
      og_title: stringValue(formData, `og_title_${suffix}`) || null,
      og_description: stringValue(formData, `og_description_${suffix}`) || null,
      og_image_url: safeHttpsUrl(stringValue(formData, `og_image_url_${suffix}`)),
      robots_index: booleanValue(formData, `robots_index_${suffix}`),
      robots_follow: booleanValue(formData, `robots_follow_${suffix}`)
    };
  });
  const { error: translationError } = await supabase
    .from("art_studio_product_translations")
    .upsert(translations, { onConflict: "product_id,locale" });
  if (translationError) redirect(`/admin/art-studio/products?error=${encodeURIComponent(translationError.message)}`);

  const rawOptions = parseArray<Partial<ArtStudioProductOption>>(formData, "options_json");
  const options = rawOptions.flatMap((option, index) => {
    const optionKey = String(option.option_key || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 50);
    const labelBg = String(option.label_bg || "").trim();
    const values = (Array.isArray(option.values) ? option.values : []).flatMap((value) => {
      const item = value as Partial<ArtStudioOptionValue>;
      const storedValue = String(item.value || "").trim();
      const itemLabelBg = String(item.label_bg || "").trim();
      if (!storedValue || !itemLabelBg) return [];
      return [{ value: storedValue, label_bg: itemLabelBg, label_en: item.label_en ? String(item.label_en) : null, hex_color: item.hex_color ? String(item.hex_color) : null }];
    });
    if (!optionKey || !labelBg || !values.length) return [];
    const inputType: ArtStudioProductOption["input_type"] = option.input_type === "radio" || option.input_type === "swatch" ? option.input_type : "select";
    return [{
      product_id: productId,
      option_key: optionKey,
      label_bg: labelBg,
      label_en: option.label_en ? String(option.label_en) : null,
      input_type: inputType,
      is_required: option.is_required !== false,
      values,
      sort_order: Number.isFinite(Number(option.sort_order)) ? Number(option.sort_order) : index * 10
    }];
  });

  const rawOffers = parseArray<Partial<ArtStudioProductOffer>>(formData, "offers_json");
  const offers = rawOffers.flatMap((offer, index) => {
    const labelBg = String(offer.label_bg || "").trim();
    const price = Number(offer.price);
    if (!labelBg || !Number.isFinite(price) || price < 0) return [];
    return [{
      product_id: productId,
      label_bg: labelBg,
      label_en: offer.label_en ? String(offer.label_en).trim() : null,
      price,
      currency: String(offer.currency || "EUR").toUpperCase().slice(0, 3),
      payment_link_url: safeHttpsUrl(String(offer.payment_link_url || "")),
      is_active: offer.is_active !== false,
      sort_order: Number.isFinite(Number(offer.sort_order)) ? Number(offer.sort_order) : index * 10
    }];
  });

  const { error: optionDeleteError } = await supabase.from("art_studio_product_options").delete().eq("product_id", productId);
  if (optionDeleteError) redirect(`/admin/art-studio/products?error=${encodeURIComponent(optionDeleteError.message)}`);
  if (options.length) {
    const { error } = await supabase.from("art_studio_product_options").insert(options);
    if (error) redirect(`/admin/art-studio/products?error=${encodeURIComponent(error.message)}`);
  }

  const { error: offerDeleteError } = await supabase.from("art_studio_product_offers").delete().eq("product_id", productId);
  if (offerDeleteError) redirect(`/admin/art-studio/products?error=${encodeURIComponent(offerDeleteError.message)}`);
  if (offers.length) {
    const { error } = await supabase.from("art_studio_product_offers").insert(offers);
    if (error) redirect(`/admin/art-studio/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidateArtStudio();
  redirect("/admin/art-studio/products?saved=product");
}

export async function archiveArtStudioProductAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  if (!id) redirect("/admin/art-studio/products?error=missing-product-id");
  const { error } = await supabase.from("art_studio_products").update({ is_active: false }).eq("id", id);
  if (error) redirect(`/admin/art-studio/products?error=${encodeURIComponent(error.message)}`);
  revalidateArtStudio();
  redirect("/admin/art-studio/products?archived=1");
}

export async function saveArtStudioSettingsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const payload = {
    pickup_name_bg: stringValue(formData, "pickup_name_bg") || null,
    pickup_name_en: stringValue(formData, "pickup_name_en") || null,
    pickup_address_bg: stringValue(formData, "pickup_address_bg") || null,
    pickup_address_en: stringValue(formData, "pickup_address_en") || null,
    pickup_phone: stringValue(formData, "pickup_phone") || null,
    pickup_instructions_bg: stringValue(formData, "pickup_instructions_bg") || null,
    pickup_instructions_en: stringValue(formData, "pickup_instructions_en") || null,
    econt_instructions_bg: stringValue(formData, "econt_instructions_bg") || null,
    econt_instructions_en: stringValue(formData, "econt_instructions_en") || null,
    orders_enabled: booleanValue(formData, "orders_enabled")
  };
  const result = id
    ? await supabase.from("art_studio_public_settings").update(payload).eq("id", id)
    : await supabase.from("art_studio_public_settings").insert(payload);
  if (result.error) redirect(`/admin/art-studio/settings?error=${encodeURIComponent(result.error.message)}`);
  revalidateArtStudio();
  redirect("/admin/art-studio/settings?saved=1");
}

/**
 * Texts of the Art Studio landing and product type pages (admin "Текстове" tab).
 * Empty fields fall back to the defaults in art-studio-copy.ts.
 */
export async function saveArtStudioPageCopyAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const locales: Locale[] = ["bg", "en"];

  const landing: Record<string, Record<string, unknown>> = {};
  for (const locale of locales) {
    const entry: Record<string, unknown> = {};
    for (const key of landingTextKeys) {
      const value = stringValue(formData, `landing.${locale}.${key}`).slice(0, 1000);
      if (value) entry[key] = value;
    }
    const trust = parseTrustLines(stringValue(formData, `landing.${locale}.trust`));
    if (trust.length) entry.trust = trust;
    const steps = parsePairLines(stringValue(formData, `landing.${locale}.steps`));
    if (steps.length) entry.steps = steps;
    const faq = parseFaqLines(stringValue(formData, `landing.${locale}.faq`));
    if (faq.length) entry.faq = faq;
    landing[locale] = entry;
  }

  const types: Record<string, Record<string, Record<string, unknown>>> = {};
  const typeNames = formData.getAll("type_names").map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean).slice(0, 30);
  for (const internalName of typeNames) {
    const perLocale: Record<string, Record<string, unknown>> = {};
    for (const locale of locales) {
      const entry: Record<string, unknown> = {};
      for (const key of typeTextKeys) {
        const value = stringValue(formData, `type.${internalName}.${locale}.${key}`).slice(0, 1000);
        if (value) entry[key] = value;
      }
      const benefits = parsePairLines(stringValue(formData, `type.${internalName}.${locale}.benefits`));
      if (benefits.length) entry.benefits = benefits;
      const intro = parseParagraphs(stringValue(formData, `type.${internalName}.${locale}.intro`));
      if (intro.length) entry.intro = intro;
      const faq = parseFaqLines(stringValue(formData, `type.${internalName}.${locale}.faq`));
      if (faq.length) entry.faq = faq;
      perLocale[locale] = entry;
    }
    types[internalName] = perLocale;
  }

  const landingSections: Record<string, boolean> = {};
  for (const key of landingSectionKeys) landingSections[key] = booleanValue(formData, `landing_sections.${key}`);
  const typeSections: Record<string, Record<string, boolean | number>> = {};
  for (const internalName of typeNames) {
    const entry: Record<string, boolean | number> = {};
    for (const key of typeSectionKeys) entry[key] = booleanValue(formData, `type_sections.${internalName}.${key}`);
    const count = Number.parseInt(stringValue(formData, `type_sections.${internalName}.designsCount`), 10);
    entry.designsCount = Number.isFinite(count) ? Math.min(24, Math.max(1, count)) : 4;
    typeSections[internalName] = entry;
  }
  const linkValue = (key: string) => {
    const value = stringValue(formData, `landing_links.${key}`).slice(0, 300);
    return value && (value.startsWith("/") || /^https:\/\//i.test(value)) ? value : "";
  };
  const landingLinks = { gallery: linkValue("gallery"), custom: linkValue("custom") };

  const payload = { page_copy: { landing, types, landing_sections: landingSections, type_sections: typeSections, landing_links: landingLinks } as Json };
  const result = id
    ? await supabase.from("art_studio_public_settings").update(payload).eq("id", id)
    : await supabase.from("art_studio_public_settings").insert(payload);
  if (result.error) redirect(`/admin/art-studio/copy?error=${encodeURIComponent(result.error.message)}`);
  revalidateArtStudio();
  redirect("/admin/art-studio/copy?saved=1");
}

export async function updateArtStudioOrderAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  if (!id) redirect("/admin/art-studio/orders?error=missing-order-id");
  const paymentStatus = stringValue(formData, "payment_status");
  const productionStatus = stringValue(formData, "production_status");
  const allowedPayment = ["pending", "paid", "failed", "expired", "refunded"];
  const allowedProduction = ["new", "in_production", "ready_for_pickup", "shipped", "completed", "cancelled"];
  if (!allowedPayment.includes(paymentStatus) || !allowedProduction.includes(productionStatus)) {
    redirect("/admin/art-studio/orders?error=invalid-status");
  }
  const { error } = await supabase
    .from("art_studio_orders")
    .update({ payment_status: paymentStatus as ArtStudioPaymentStatus, production_status: productionStatus as ArtStudioProductionStatus })
    .eq("id", id);
  if (error) redirect(`/admin/art-studio/orders?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/art-studio/orders");
  redirect("/admin/art-studio/orders?saved=1");
}
