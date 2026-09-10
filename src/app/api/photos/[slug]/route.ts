import { NextResponse } from "next/server";
import { getPhotoBySlug } from "@/lib/photos";
import { isLocale } from "@/lib/i18n";
import type { PhotoPrintSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugPattern = /^[a-z0-9-]{1,160}$/i;

/**
 * One published photo for the Art Studio print form, which lives on a cached page and learns the
 * photo from `?photo=<slug>` in the browser. Public data only: code, title, thumbnail, print flag.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") || "bg";
  const locale = isLocale(localeParam) ? localeParam : "bg";
  if (!slugPattern.test(slug)) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const photo = await getPhotoBySlug(slug, locale).catch(() => null);
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=60" } });
  }

  const summary: PhotoPrintSummary = {
    photo_code: photo.photo_code,
    slug: photo.slug,
    title: photo.title,
    alt: photo.alt,
    thumb_url: photo.thumb_url,
    print_enabled: photo.print_enabled
  };
  return NextResponse.json({ photo: summary }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } });
}
