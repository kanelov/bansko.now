import { NextResponse } from "next/server";
import { getDisplayVersion } from "@/lib/business-platform/displays";

/**
 * Версията на един екран: ~40 байта, които телевизорът пита на 60 s.
 * Edge кешът държи отговора 30 s, така че базата се пита най-много веднъж на
 * 30 s за всички телевизори с този token; браузърът не го кешира (max-age=0).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const version = await getDisplayVersion(token);

  if (!version) {
    return NextResponse.json({ error: "not-found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { v: version },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
  );
}
