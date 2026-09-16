import { formatTime, groupWeek, weekdayAbbreviation, type BusinessHours, type OpenState } from "@/lib/business-platform/hours";
import type { BusinessHourException, Locale } from "@/lib/types";

/**
 * „Отворено до 18:00“ и седмичната таблица. Сметката е в hours.ts - тук е само
 * изписването, за да е еднакво на профила и на QR менюто.
 */

const labels = {
  bg: {
    open: "Отворено",
    openUntil: (time: string) => `Отворено до ${time}`,
    closed: "Затворено",
    opensAt: (time: string) => `отваря в ${time}`,
    opensOn: (day: string, time: string) => `отваря ${day} в ${time}`,
    hours: "Работно време",
    closedDay: "Почивен ден",
    exceptions: "Промени в работното време"
  },
  en: {
    open: "Open",
    openUntil: (time: string) => `Open until ${time}`,
    closed: "Closed",
    opensAt: (time: string) => `opens at ${time}`,
    opensOn: (day: string, time: string) => `opens ${day} at ${time}`,
    hours: "Opening hours",
    closedDay: "Closed",
    exceptions: "Changes to the opening hours"
  }
};

export function openStateText(state: OpenState, locale: Locale) {
  const text = labels[locale];

  if (state.state === "unknown") {
    return null;
  }

  if (state.state === "open") {
    return state.until ? text.openUntil(formatTime(state.until)) : text.open;
  }

  if (!state.nextOpen) {
    return text.closed;
  }

  return state.nextOpen.isToday
    ? `${text.closed} · ${text.opensAt(formatTime(state.nextOpen.opens))}`
    : `${text.closed} · ${text.opensOn(weekdayAbbreviation(state.nextOpen.weekday, locale), formatTime(state.nextOpen.opens))}`;
}

export function BusinessOpenBadge({ state, locale, tone = "light" }: { state: OpenState; locale: Locale; tone?: "light" | "dark" }) {
  const text = openStateText(state, locale);

  if (!text) {
    return null;
  }

  const open = state.state === "open";
  const base = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold";
  const skin =
    tone === "dark"
      ? open
        ? "bg-white/15 text-white"
        : "bg-black/30 text-stone-100"
      : open
        ? "bg-sage text-forest"
        : "bg-stone-200 text-stone-650";

  return (
    <span className={`${base} ${skin}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${open ? "bg-moss" : "bg-clay"}`} />
      {text}
    </span>
  );
}

function formatExceptionDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bg-BG", {
    timeZone: "UTC",
    day: "numeric",
    month: "long"
  }).format(new Date(`${date}T12:00:00Z`));
}

export function BusinessHoursList({
  hours,
  locale,
  today
}: {
  hours: BusinessHours;
  locale: Locale;
  today?: string;
}) {
  const rows = groupWeek(hours.week, locale);
  const upcoming = hours.exceptions.filter((exception) => !today || exception.date >= today).slice(0, 4);

  if (rows.every((row) => row.value === labels[locale].closedDay) && upcoming.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase text-moss">{labels[locale].hours}</p>
      <dl className="mt-3 grid gap-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 border-b border-stone-200 pb-1.5 last:border-b-0">
            <dt className="text-stone-650">{row.label}</dt>
            <dd className="font-semibold text-stone-950">{row.value}</dd>
          </div>
        ))}
      </dl>

      {upcoming.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase text-moss">{labels[locale].exceptions}</p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {upcoming.map((exception: BusinessHourException) => (
              <li key={exception.id} className="flex items-baseline justify-between gap-6">
                <span className="text-stone-650">
                  {formatExceptionDate(exception.date, locale)}
                  {exception.note ? ` · ${exception.note}` : ""}
                </span>
                <span className="font-semibold text-stone-950">
                  {exception.is_closed || !exception.opens || !exception.closes
                    ? labels[locale].closedDay
                    : `${formatTime(exception.opens)} – ${formatTime(exception.closes)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
