import { NextResponse } from "next/server";
import { getPublishedPhotos } from "@/lib/photos";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Paged photo cards for the archive grid: filters, search and "load more". Public data only. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") || "bg";
  const locale = isLocale(localeParam) ? localeParam : "bg";
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const year = Number.parseInt(searchParams.get("year") || "", 10);

  const result = await getPublishedPhotos(locale, {
    page: Number.isFinite(page) ? page : 1,
    category: searchParams.get("category"),
    location: searchParams.get("location"),
    season: searchParams.get("season"),
    orientation: searchParams.get("orientation"),
    year: Number.isFinite(year) ? year : null,
    query: searchParams.get("q")
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" }
  });
}
