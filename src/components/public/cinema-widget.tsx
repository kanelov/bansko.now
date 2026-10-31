import { cinemaDays, formatFetchedAt, getCinemaProgram } from "@/lib/cinema";
import { CinemaDayTabs } from "@/components/public/cinema-day-tabs";
import type { Locale } from "@/lib/types";

/**
 * Кино блокът на началната страница, под прогнозата и в същия формат.
 * Показва се само когато има взета програма за следващите три дни; иначе нищо.
 */
export async function CinemaWidget({ locale = "bg" }: { locale?: Locale }) {
  const program = await getCinemaProgram();
  if (!program || !program.fetched_at) return null;
  const days = cinemaDays(program, locale);
  if (!days.some((day) => day.screenings.length)) return null;

  const en = locale === "en";
  return (
    <section className="rounded-2xl border border-stone-200 bg-[#f5efe3] p-5 shadow-soft">
      <CinemaDayTabs
        days={days}
        locale={locale}
        eyebrow={en ? `Cinema · ${program.cinema_name}` : `Кино · ${program.cinema_name}`}
        ticketsUrl={program.tickets_url}
        footer={
          en
            ? `Updated ${formatFetchedAt(program.fetched_at, locale)} · Kino Arena`
            : `Актуална към ${formatFetchedAt(program.fetched_at, locale)} · Кино Арена`
        }
      />
    </section>
  );
}
