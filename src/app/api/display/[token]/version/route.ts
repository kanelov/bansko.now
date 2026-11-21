import { NextResponse } from "next/server";
import { getDisplayVersion } from "@/lib/business-platform/displays";

/**
 * Версията на един екран (~40 байта). От 21.11.2026 телевизорът я пита само
 * 3 пъти на ден, преди зареждането по график, за да провери, че сървърът
 * отговаря; записва и „видян“ (last_seen_at). Edge кешът е 30 s.
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
