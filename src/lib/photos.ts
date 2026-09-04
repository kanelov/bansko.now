import "server-only";

import { cache } from "react";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { getPublicPhotoUrl } from "@/lib/photo-storage";
import type { Locale, Photo, PhotoLicenseType } from "@/lib/types";

/**
 * Read access for the photo library. Public queries only return published photos and
 * select the columns the page needs, in line with the project's low egress rules.
 */

export const photoPageSize = 24;

const listColumns =
  "id,photo_code,slug,title_bg,title_en,alt_bg,alt_en,location_name,year_taken,season,category,tags,orientation,width,height,thumb_key,article_key,dominant_color,is_featured,price_tier";

export type PhotoCard = Pick<
  Photo,
  | "id"
  | "photo_code"
  | "slug"
  | "title_bg"
  | "title_en"
  | "alt_bg"
  | "alt_en"
  | "location_name"
  | "year_taken"
  | "season"
  | "category"
  | "tags"
  | "orientation"
  | "width"
  | "height"
  | "thumb_key"
  | "article_key"
  | "dominant_color"
  | "is_featured"
  | "price_tier"
>;

export type LocalizedPhotoCard = PhotoCard & { title: string; alt: string; thumb_url: string | null; article_url: string | null };
export type LocalizedPhoto = Photo & {
  title: string;
  description: string | null;
  alt: string;
  caption: string | null;
  thumb_url: string | null;
  article_url: string | null;
  preview_url: string | null;
};

export type PhotoQuery = {
  page?: number;
  pageSize?: number;
  category?: string | null;
  location?: string | null;
  season?: string | null;
  orientation?: string | null;
  year?: number | null;
  query?: string | null;
};

function localizeCard(photo: PhotoCard, locale: Locale): LocalizedPhotoCard {
  const title = (locale === "en" ? photo.title_en || photo.title_bg : photo.title_bg) || photo.photo_code;
  return {
    ...photo,
    title,
    alt: (locale === "en" ? photo.alt_en || photo.alt_bg : photo.alt_bg) || title,
    thumb_url: getPublicPhotoUrl(photo.thumb_key),
    article_url: getPublicPhotoUrl(photo.article_key)
  };
}

export function localizePhoto(photo: Photo, locale: Locale): LocalizedPhoto {
  const title = (locale === "en" ? photo.title_en || photo.title_bg : photo.title_bg) || photo.photo_code;
  return {
    ...photo,
    title,
    description: locale === "en" ? photo.description_en || photo.description_bg : photo.description_bg,
    alt: (locale === "en" ? photo.alt_en || photo.alt_bg : photo.alt_bg) || title,
    caption: locale === "en" ? photo.caption_en || photo.caption_bg : photo.caption_bg,
    thumb_url: getPublicPhotoUrl(photo.thumb_key),
    article_url: getPublicPhotoUrl(photo.article_key),
    preview_url: getPublicPhotoUrl(photo.preview_key)
  };
}

export async function getPublishedPhotos(locale: Locale, options: PhotoQuery = {}) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { photos: [] as LocalizedPhotoCard[], total: 0, page: 1, pageCount: 0 };

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, options.pageSize ?? photoPageSize));
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("photos")
    .select(listColumns, { count: "exact" })
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1);

  if (options.category) query = query.eq("category", options.category);
  if (options.location) query = query.eq("location_name", options.location);
  if (options.season) query = query.eq("season", options.season as NonNullable<Photo["season"]>);
  if (options.orientation) query = query.eq("orientation", options.orientation as NonNullable<Photo["orientation"]>);
  if (options.year) query = query.eq("year_taken", options.year);
  if (options.query) {
    const term = `%${options.query.replace(/[%_]/g, "").slice(0, 80)}%`;
    query = query.or(
      `title_bg.ilike.${term},title_en.ilike.${term},description_bg.ilike.${term},description_en.ilike.${term},location_name.ilike.${term}`
    );
  }

  const { data, error, count } = await query;
  if (error) return { photos: [] as LocalizedPhotoCard[], total: 0, page, pageCount: 0 };

  const photos = ((data ?? []) as unknown as PhotoCard[]).map((photo) => localizeCard(photo, locale));
  const total = count ?? photos.length;
  return { photos, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Distinct values for the archive filters; one small query, cached per render. */
export const getPhotoFacets = cache(async () => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { categories: [] as string[], locations: [] as string[], years: [] as number[] };
  const { data } = await supabase
    .from("photos")
    .select("category,location_name,year_taken")
    .eq("is_published", true)
    .limit(2000);

  const categories = new Set<string>();
  const locations = new Set<string>();
  const years = new Set<number>();
  for (const row of data ?? []) {
    if (row.category) categories.add(row.category);
    if (row.location_name) locations.add(row.location_name);
    if (row.year_taken) years.add(row.year_taken);
  }
  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b, "bg")),
    locations: [...locations].sort((a, b) => a.localeCompare(b, "bg")),
    years: [...years].sort((a, b) => b - a)
  };
});

export async function getPhotoBySlug(slug: string, locale: Locale) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("photos").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return data ? localizePhoto(data as Photo, locale) : null;
}

export async function getRelatedPhotos(photo: LocalizedPhoto, locale: Locale, limit = 6) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [] as LocalizedPhotoCard[];
  let query = supabase
    .from("photos")
    .select(listColumns)
    .eq("is_published", true)
    .neq("id", photo.id)
    .limit(limit);
  if (photo.category) query = query.eq("category", photo.category);
  const { data } = await query;
  return ((data ?? []) as unknown as PhotoCard[]).map((item) => localizeCard(item, locale));
}

export async function getPhotoLicenseTypes() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [] as PhotoLicenseType[];
  const { data } = await supabase
    .from("photo_license_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as PhotoLicenseType[];
}

/** Price for one photo and license: the tier price unless the photo overrides it. */
export function photoLicensePrice(photo: Pick<Photo, "price_tier" | "price_override_web" | "price_override_print">, license: PhotoLicenseType) {
  const override = license.download_variant === "full_resolution" ? photo.price_override_print : photo.price_override_web;
  if (override != null) return Number(override);
  return Number(photo.price_tier === "premium" ? license.price_premium_eur : license.price_standard_eur);
}

/** Published photos for the sitemap. */
export async function getPhotoSitemapEntries() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [] as Array<Pick<Photo, "slug" | "updated_at" | "title_bg" | "title_en" | "thumb_key">>;
  const { data } = await supabase
    .from("photos")
    .select("slug,updated_at,title_bg,title_en,thumb_key")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(5000);
  return (data ?? []) as Array<Pick<Photo, "slug" | "updated_at" | "title_bg" | "title_en" | "thumb_key">>;
}

/** Slugs prerendered at build time; the rest render on first visit. */
export async function getRecentPhotoSlugs(limit = 100) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [] as string[];
  const { data } = await supabase
    .from("photos")
    .select("slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => row.slug as string);
}

/** Photo behind an article image URL (photos/public/article/BNK-000123.webp). */
export async function getPhotoByCode(code: string, locale: Locale) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("photos")
    .select("photo_code,slug,title_bg,title_en,is_published,licensing_enabled")
    .eq("photo_code", code.toUpperCase())
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  return {
    photo_code: data.photo_code as string,
    slug: data.slug as string,
    title: ((locale === "en" ? data.title_en || data.title_bg : data.title_bg) as string) || (data.photo_code as string),
    licensing_enabled: Boolean(data.licensing_enabled)
  };
}

/** Photo codes referenced by an article's featured image and body. */
export function photoCodesInContent(...values: Array<string | null | undefined>) {
  const codes = new Set<string>();
  for (const value of values) {
    for (const match of String(value || "").matchAll(/photos\/public\/(?:article|thumb|preview)\/(BNK-\d{6})\./gi)) {
      codes.add(match[1].toUpperCase());
    }
  }
  return [...codes];
}
