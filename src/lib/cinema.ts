import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { sofiaClock } from "@/lib/business-platform/hours";
import type { Locale } from "@/lib/types";

/** Една прожекция в jsonb колоната cinema_programs.screenings. Само факти, без постери и описания. */
export type CinemaScreening = {
  date: string; // YYYY-MM-DD
  title: string;
  original_title: string | null;
  url: string | null; // страницата на филма в kinoarena.com (за „Билети“)
  times: { time: string; hall: string | null; url: string | null }[];
  format: string | null; // 2D / 3D / IMAX…
  language: string | null; // субтитри / дублаж
  age: string | null; // 12+, 16+, Б…
  duration_min: number | null;
  genre: string | null;
};

export type CinemaProgram = {
  id: string;
  cinema_name: string;
  source_url: string;
  tickets_url: string;
  screenings: CinemaScreening[];
  fetched_at: string | null;
  fetch_ok: boolean;
  fetch_error: string | null;
  updated_at: string;
};

export type CinemaDay = {
  date: string;
  label: string; // „Днес“, „Утре“, „Нед“
  longLabel: string; // „петък, 31 окт“
  screenings: CinemaScreening[];
};

export const cinemaProgramId = "arena-bansko";

function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

function weekdayShort(date: string, locale: Locale) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bg-BG", { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatCinemaDate(date: string, locale: Locale) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bg-BG", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatFetchedAt(iso: string | null, locale: Locale) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bg-BG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" }).format(new Date(iso));
}

/** Днес, утре и вдругиден по софийско време, с прожекциите им (минали часове за днес отпадат). */
export function cinemaDays(program: CinemaProgram, locale: Locale, now = new Date()): CinemaDay[] {
  const clock = sofiaClock(now);
  const labels = locale === "en" ? ["Today", "Tomorrow"] : ["Днес", "Утре"];
  return [0, 1, 2].map((offset) => {
    const date = addDays(clock.date, offset);
    const screenings = program.screenings
      .filter((item) => item.date === date)
      .map((item) => {
        if (offset !== 0) return item;
        // Днес: махаме започналите преди повече от 15 минути прожекции.
        const times = item.times.filter((slot) => {
          const [h, min] = slot.time.split(":").map(Number);
          return h * 60 + min >= clock.minutes - 15;
        });
        return { ...item, times };
      })
      .filter((item) => item.times.length)
      .sort((a, b) => a.times[0].time.localeCompare(b.times[0].time));
    return { date, label: labels[offset] ?? weekdayShort(date, locale), longLabel: formatCinemaDate(date, locale), screenings };
  });
}

export async function getCinemaProgram(): Promise<CinemaProgram | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cinema_programs")
    .select("id, cinema_name, source_url, tickets_url, screenings, fetched_at, fetch_ok, fetch_error, updated_at")
    .eq("id", cinemaProgramId)
    .maybeSingle();
  if (error || !data) return null;
  return { ...data, screenings: Array.isArray(data.screenings) ? (data.screenings as CinemaScreening[]) : [] };
}
