import { NextResponse } from "next/server";
import { photosToCsv } from "@/lib/photo-csv";
import { getPublicPhotoUrl } from "@/lib/photo-storage";
import { siteUrl } from "@/lib/env";
import { requireAdmin } from "@/lib/supabase/auth";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Downloads every photo's editable fields as CSV, ready to be filled in and imported back. */
export async function GET() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(2000);
  const rows = ((data ?? []) as Photo[]).map((photo) => ({
    photo_code: photo.photo_code,
    title_bg: photo.title_bg,
    title_en: photo.title_en,
    description_bg: photo.description_bg,
    description_en: photo.description_en,
    alt_bg: photo.alt_bg,
    alt_en: photo.alt_en,
    caption_bg: photo.caption_bg,
    caption_en: photo.caption_en,
    location_name: photo.location_name,
    category: photo.category,
    tags: (photo.tags ?? []).join(", "),
    season: photo.season,
    date_taken: photo.date_taken,
    year_taken: photo.year_taken,
    price_tier: photo.price_tier,
    slug: photo.slug,
    is_published: photo.is_published ? "TRUE" : "FALSE",
    image_url: getPublicPhotoUrl(photo.preview_key) || getPublicPhotoUrl(photo.thumb_key) || "",
    photo_page: `${siteUrl}/photos/${photo.slug}`
  }));

  return new NextResponse(photosToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bansko-photos-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
