import { NextResponse } from "next/server";
import { getGalleryDesignDetail } from "@/lib/art-studio-gallery";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Variants and current gallery stock for one selected design (fetched only after selection). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") || "bg";
  const locale = isLocale(localeParam) ? localeParam : "bg";
  if (!uuidPattern.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const detail = await getGalleryDesignDetail(id, locale);
    if (!detail) return NextResponse.json({ error: "Design not found" }, { status: 404 });
    return NextResponse.json(detail, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    console.error("[art studio design detail unavailable]", error);
    return NextResponse.json({ error: "Gallery unavailable" }, { status: 503 });
  }
}
