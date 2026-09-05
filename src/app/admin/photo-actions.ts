"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidatePublicPath } from "@/lib/articles-admin";
import { photoTextKeys, resolvePhotoArchiveCopy } from "@/lib/photo-copy";
import { deletePhoto } from "@/lib/photo-storage";
import { requireAdmin } from "@/lib/supabase/auth";
import { slugify } from "@/lib/slug";
import type { Json, Locale, Photo, PhotoLicenseType } from "@/lib/types";

function value(formData: FormData, key: string, maxLength = 300) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function numberOrNull(formData: FormData, key: string) {
  const parsed = Number.parseFloat(value(formData, key, 20).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const seasons = ["winter", "spring", "summer", "autumn"];

/** Saves the editable fields of one photograph. Files and codes are never changed here. */
export async function updatePhotoAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id", 40);
  if (!id) redirect("/admin/photos?error=missing-id");

  const titleBg = value(formData, "title_bg", 200);
  if (!titleBg) redirect("/admin/photos?error=" + encodeURIComponent("Липсва заглавие на български."));

  const season = value(formData, "season", 20);
  const tags = value(formData, "tags", 500)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 25);
  const dateTaken = value(formData, "date_taken", 20);
  const yearFromDate = dateTaken ? Number.parseInt(dateTaken.slice(0, 4), 10) : null;
  const yearRaw = Number.parseInt(value(formData, "year_taken", 10), 10);
  const isPublished = checkbox(formData, "is_published");

  const payload: Partial<Photo> = {
    title_bg: titleBg,
    title_en: value(formData, "title_en", 200) || null,
    description_bg: value(formData, "description_bg", 2000) || null,
    description_en: value(formData, "description_en", 2000) || null,
    alt_bg: value(formData, "alt_bg", 200) || null,
    alt_en: value(formData, "alt_en", 200) || null,
    caption_bg: value(formData, "caption_bg", 300) || null,
    caption_en: value(formData, "caption_en", 300) || null,
    location_name: value(formData, "location_name", 120) || null,
    category: value(formData, "category", 60) || null,
    tags,
    date_taken: dateTaken || null,
    year_taken: Number.isFinite(yearRaw) ? yearRaw : yearFromDate,
    season: seasons.includes(season) ? (season as Photo["season"]) : null,
    price_tier: value(formData, "price_tier", 20) === "premium" ? "premium" : "standard",
    price_override_web: numberOrNull(formData, "price_override_web"),
    price_override_print: numberOrNull(formData, "price_override_print"),
    licensing_enabled: checkbox(formData, "licensing_enabled"),
    print_enabled: checkbox(formData, "print_enabled"),
    is_featured: checkbox(formData, "is_featured"),
    is_published: isPublished,
    monitoring_status: (["not_submitted", "submitted", "monitoring", "disabled"] as const).includes(
      value(formData, "monitoring_status", 20) as Photo["monitoring_status"]
    )
      ? (value(formData, "monitoring_status", 20) as Photo["monitoring_status"])
      : "not_submitted",
    monitoring_reference: value(formData, "monitoring_reference", 120) || null
  };

  const slug = value(formData, "slug", 160);
  if (slug) payload.slug = slugify(slug);
  if (isPublished) payload.published_at = value(formData, "published_at", 40) || new Date().toISOString();

  const { error } = await supabase.from("photos").update(payload).eq("id", id);
  if (error) redirect(`/admin/photos?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/photos");
  revalidatePublicPath("/photos");
  if (payload.slug) revalidatePublicPath(`/photos/${payload.slug}`);
  redirect("/admin/photos?saved=1");
}

/** Removes a photograph and its files. Blocked while it is used in an article. */
export async function deletePhotoAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id", 40);
  if (!id) redirect("/admin/photos?error=missing-id");

  const { data: photo } = await supabase
    .from("photos")
    .select("thumb_key,article_key,preview_key,web_license_key,full_resolution_key")
    .eq("id", id)
    .maybeSingle();

  const { count } = await supabase.from("article_photos").select("id", { count: "exact", head: true }).eq("photo_id", id);
  if (count) redirect(`/admin/photos?error=${encodeURIComponent("Фотографията се използва в статия и не може да се изтрие.")}`);

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) redirect(`/admin/photos?error=${encodeURIComponent(error.message)}`);

  for (const key of [photo?.thumb_key, photo?.article_key, photo?.preview_key, photo?.web_license_key, photo?.full_resolution_key]) {
    if (key) await deletePhoto(key).catch(() => undefined);
  }

  revalidatePath("/admin/photos");
  revalidatePublicPath("/photos");
  redirect("/admin/photos?deleted=1");
}

/** Every photo page plus the article pages, which show the photographer's credit under library images. */
function revalidatePhotoPages() {
  revalidatePath("/admin/photos", "layout");
  revalidatePublicPath("/photos", "layout");
  revalidatePublicPath("/[categorySlug]", "layout");
}

const copyPath = "/admin/photos/copy";

/**
 * Texts of the photo archive pages (admin "Текстове и лицензи"). Only values that differ from
 * the defaults are stored, so a changed photographer name keeps flowing into the derived texts.
 */
export async function savePhotoPageCopyAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id", 40);
  const locales: Locale[] = ["bg", "en"];

  const pageCopy: Record<string, Record<string, string>> = {};
  for (const locale of locales) {
    const entry: Record<string, string> = {};
    const photographerName = value(formData, `${locale}.photographerName`, 120);
    const defaults = resolvePhotoArchiveCopy({}, locale);
    if (photographerName && photographerName !== defaults.photographerName) entry.photographerName = photographerName;
    const base = resolvePhotoArchiveCopy({ [locale]: { photographerName } }, locale);
    for (const key of photoTextKeys) {
      if (key === "photographerName") continue;
      const text = value(formData, `${locale}.${key}`, 1000);
      if (text && text !== base[key]) entry[key] = text;
    }
    pageCopy[locale] = entry;
  }

  const payload = { page_copy: pageCopy as Json };
  const result = id
    ? await supabase.from("photo_public_settings").update(payload).eq("id", id)
    : await supabase.from("photo_public_settings").insert(payload);
  if (result.error) redirect(`${copyPath}?error=${encodeURIComponent(result.error.message)}`);

  revalidatePhotoPages();
  redirect(`${copyPath}?saved=texts`);
}

/**
 * Names, summaries, prices and terms of the license types. Changed terms get a new version;
 * paid orders keep the snapshot they were sold with. Codes and download variants never change here.
 */
export async function savePhotoLicenseTypesAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const ids = formData
    .getAll("license_ids")
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
  const { data: rows } = await supabase.from("photo_license_types").select("*").in("id", ids);
  const existing = new Map(((rows ?? []) as PhotoLicenseType[]).map((row) => [row.id, row]));
  const normalizeTerms = (text: string) => text.replace(/\r\n/g, "\n").trim();

  for (const id of ids) {
    const current = existing.get(id);
    if (!current) continue;

    const nameBg = value(formData, `name_bg_${id}`, 120);
    const nameEn = value(formData, `name_en_${id}`, 120);
    const termsBg = normalizeTerms(value(formData, `terms_bg_${id}`, 20000));
    const termsEn = normalizeTerms(value(formData, `terms_en_${id}`, 20000));
    if (!nameBg || !nameEn || !termsBg || !termsEn) {
      redirect(`${copyPath}?error=${encodeURIComponent(`Лицензът ${current.code} трябва да има име и условия на двата езика.`)}`);
    }

    const priceStandard = numberOrNull(formData, `price_standard_${id}`);
    const pricePremium = numberOrNull(formData, `price_premium_${id}`);
    if (priceStandard == null || pricePremium == null || priceStandard < 0 || pricePremium < 0) {
      redirect(`${copyPath}?error=${encodeURIComponent(`Лицензът ${current.code} трябва да има две валидни цени в евро.`)}`);
    }

    const printRun = numberOrNull(formData, `print_run_limit_${id}`);
    const sortOrder = numberOrNull(formData, `sort_order_${id}`);
    const termsChanged = termsBg !== normalizeTerms(current.terms_bg) || termsEn !== normalizeTerms(current.terms_en);
    const payload: Partial<PhotoLicenseType> = {
      name_bg: nameBg,
      name_en: nameEn,
      summary_bg: value(formData, `summary_bg_${id}`, 600) || null,
      summary_en: value(formData, `summary_en_${id}`, 600) || null,
      price_standard_eur: priceStandard,
      price_premium_eur: pricePremium,
      print_run_limit: printRun != null && printRun > 0 ? Math.round(printRun) : null,
      sort_order: sortOrder != null ? Math.round(sortOrder) : current.sort_order,
      is_active: checkbox(formData, `is_active_${id}`),
      terms_bg: termsBg,
      terms_en: termsEn,
      terms_version: termsChanged ? current.terms_version + 1 : current.terms_version
    };

    const { error } = await supabase.from("photo_license_types").update(payload).eq("id", id);
    if (error) redirect(`${copyPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePhotoPages();
  redirect(`${copyPath}?saved=licenses`);
}
