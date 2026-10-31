import { NextResponse } from "next/server";
import { revalidatePublicPath } from "@/lib/articles-admin";
import { cinemaProgramId } from "@/lib/cinema";
import { fetchKinoArenaProgram } from "@/lib/cinema-fetch";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Взима програмата на Арена Банско от официалния сайт на Кино Арена (vercel.json → crons, вторник и петък
// сутрин) и я записва в cinema_programs. Само факти: заглавие, дата, час, формат, език, възраст, жанр,
// продължителност. Около 25 заявки на пускане: лентата с дните, 7 дни напред и по една страница на филм.
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
    const screenings = await fetchKinoArenaProgram(program.source_url);
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
