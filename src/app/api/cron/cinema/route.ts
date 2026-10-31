import { NextResponse } from "next/server";
import { revalidatePublicPath } from "@/lib/articles-admin";
import { cinemaProgramId } from "@/lib/cinema";
import { parseKinoArenaProgram } from "@/lib/cinema-parse";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Взима програмата на Арена Банско от официалната страница на Кино Арена (vercel.json → crons,
// два пъти седмично) и я записва в cinema_programs. Само факти: заглавие, дата, час, зала, формат, възраст.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "no-service-role" }, { status: 503 });
  }
  const { data: program } = await supabase.from("cinema_programs").select("id, source_url").eq("id", cinemaProgramId).maybeSingle();
  if (!program) {
    return NextResponse.json({ ok: false, reason: "no-program-row" }, { status: 503 });
  }

  const now = new Date().toISOString();
  try {
    const response = await fetch(program.source_url, {
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0 (compatible; BanskoNOW/1.0; +https://bansko.now)", accept: "text/html" },
      signal: AbortSignal.timeout(25_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const screenings = parseKinoArenaProgram(html, program.source_url);
    if (!screenings.length) throw new Error("Програмата е прочетена, но не бяха разпознати прожекции.");

    const { error } = await supabase
      .from("cinema_programs")
      .update({ screenings, fetched_at: now, fetch_ok: true, fetch_error: null, updated_at: now })
      .eq("id", program.id);
    if (error) throw new Error(error.message);

    revalidatePublicPath("/");
    const dates = Array.from(new Set(screenings.map((item) => item.date))).sort();
    return NextResponse.json({ ok: true, at: now, films: screenings.length, dates }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Старата програма остава; записваме само грешката и кога е опитано.
    await supabase.from("cinema_programs").update({ fetch_ok: false, fetch_error: message, updated_at: now }).eq("id", program.id);
    return NextResponse.json({ ok: false, reason: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
