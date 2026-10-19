import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

// Дневно „събуждане“ на базата (vercel.json → crons). Безплатният план на Supabase
// спира проект без заявки 7 дни; една малка анонимна заявка на ден го пази активен.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "no-config" }, { status: 503 });
  }
  const { error } = await supabase.from("categories").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
