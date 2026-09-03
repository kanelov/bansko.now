import { NextResponse } from "next/server";
import { getGalleryDesignsPage } from "@/lib/art-studio-gallery";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Four gallery designs from one category for the Art Studio picker. Public catalog data only;
 * the gallery integration secret stays on the server. Cached at the edge like the catalog.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") || "bg";
  const locale = isLocale(localeParam) ? localeParam : "bg";
  const category = (searchParams.get("category") || "").trim();
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  if (!uuidPattern.test(category) || !Number.isFinite(page) || page < 1 || page > 1000) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await getGalleryDesignsPage(locale, category, page);
    if (!result) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" }
    });
  } catch (error) {
    console.error("[art studio designs unavailable]", error);
    return NextResponse.json({ error: "Gallery unavailable" }, { status: 503 });
  }
}
