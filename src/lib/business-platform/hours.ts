import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessHour, BusinessHourException, BusinessOpenOverride, Database, Locale } from "@/lib/types";

/**
 * Работно време и „Отворено сега“. Всичко се смята в Europe/Sofia на сървъра:
 * ред в business_hours е интервал, в който е отворено; ден без ред е затворен;
 * изключение по дата има предимство; ръчният превключвател бие всичко.
 */

export const sofiaTimeZone = "Europe/Sofia";

export type HourInterval = Pick<BusinessHour, "weekday" | "opens" | "closes">;
export type HourException = Pick<BusinessHourException, "date" | "opens" | "closes" | "is_closed" | "note">;

/** 1 = понеделник … 7 = неделя (ISO), както в базата. */
export const weekdayNames: Record<Locale, string[]> = {
  bg: ["", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота", "неделя"],
  en: ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
};

const schemaDays = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  return (hours || 0) * 60 + (minutes || 0);
}

/** "08:00:00" → "8:00"; "18:30" → "18:30". */
export function formatTime(time: string) {
  const [hours, minutes = "00"] = time.split(":");
  return `${Number.parseInt(hours, 10)}:${minutes.slice(0, 2)}`;
}

export type SofiaClock = { date: string; weekday: number; minutes: number };

const weekdayByShort: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function sofiaClock(now = new Date()): SofiaClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: sofiaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23"
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: weekdayByShort[get("weekday")] ?? 1,
    minutes: Number.parseInt(get("hour"), 10) * 60 + Number.parseInt(get("minute"), 10)
  };
}

type DaySchedule = { intervals: { opens: string; closes: string }[]; note: string | null };

function scheduleFor(date: string, weekday: number, hours: HourInterval[], exceptions: HourException[]): DaySchedule {
  const exception = exceptions.find((row) => row.date === date);

  if (exception) {
    if (exception.is_closed || !exception.opens || !exception.closes) {
      return { intervals: [], note: exception.note ?? null };
    }
    return { intervals: [{ opens: exception.opens, closes: exception.closes }], note: exception.note ?? null };
  }

  const intervals = hours
    .filter((row) => row.weekday === weekday)
    .map((row) => ({ opens: row.opens, closes: row.closes }))
    .sort((a, b) => toMinutes(a.opens) - toMinutes(b.opens));

  return { intervals, note: null };
}

export type OpeningStatus =
  | { state: "open"; until: string | null; override: boolean }
  | { state: "closed"; opensAt: string | null; dayOffset: number; note: string | null; override: boolean }
  | { state: "unknown" };

const dayMs = 24 * 60 * 60 * 1000;

export function computeOpeningStatus(input: {
  hours: HourInterval[];
  exceptions: HourException[];
  override: BusinessOpenOverride;
  now?: Date;
}): OpeningStatus {
  if (input.override === "open") {
    return { state: "open", until: null, override: true };
  }

  if (input.override === "closed") {
    return { state: "closed", opensAt: null, dayOffset: 0, note: null, override: true };
  }

  if (input.hours.length === 0 && input.exceptions.length === 0) {
    return { state: "unknown" };
  }

  const now = input.now ?? new Date();
  const clock = sofiaClock(now);
  const today = scheduleFor(clock.date, clock.weekday, input.hours, input.exceptions);

  for (const interval of today.intervals) {
    const opens = toMinutes(interval.opens);
    const closes = toMinutes(interval.closes);
    /* Нощна смяна (22:00–02:00): затварянето е на другия ден. */
    const isOpen = closes > opens ? clock.minutes >= opens && clock.minutes < closes : clock.minutes >= opens;
    if (isOpen) {
      return { state: "open", until: interval.closes, override: false };
    }
  }

  const yesterdayClock = sofiaClock(new Date(now.getTime() - dayMs));
  const yesterday = scheduleFor(yesterdayClock.date, yesterdayClock.weekday, input.hours, input.exceptions);
  for (const interval of yesterday.intervals) {
    if (toMinutes(interval.closes) <= toMinutes(interval.opens) && clock.minutes < toMinutes(interval.closes)) {
      return { state: "open", until: interval.closes, override: false };
    }
  }

  const later = today.intervals.find((interval) => toMinutes(interval.opens) > clock.minutes);
  if (later) {
    return { state: "closed", opensAt: later.opens, dayOffset: 0, note: today.note, override: false };
  }

  for (let offset = 1; offset <= 7; offset++) {
    const dayClock = sofiaClock(new Date(now.getTime() + offset * dayMs));
    const day = scheduleFor(dayClock.date, dayClock.weekday, input.hours, input.exceptions);
    if (day.intervals.length) {
      return { state: "closed", opensAt: day.intervals[0].opens, dayOffset: offset, note: today.note, override: false };
    }
  }

  return { state: "closed", opensAt: null, dayOffset: 0, note: today.note, override: false };
}

export function openingStatusLabel(status: OpeningStatus, locale: Locale, now = new Date()): string | null {
  if (status.state === "unknown") {
    return null;
  }

  const bg = locale === "bg";

  if (status.state === "open") {
    if (!status.until) return bg ? "Отворено сега" : "Open now";
    return bg ? `Отворено до ${formatTime(status.until)}` : `Open until ${formatTime(status.until)}`;
  }

  if (status.override) {
    return bg ? "Затворено сега" : "Closed now";
  }

  const note = status.note ? ` · ${status.note}` : "";

  if (!status.opensAt) {
    return (bg ? "Затворено" : "Closed") + note;
  }

  const time = formatTime(status.opensAt);

  if (status.dayOffset === 0) {
    return bg ? `Затворено · отваря в ${time}${note}` : `Closed · opens at ${time}${note}`;
  }

  if (status.dayOffset === 1) {
    return bg ? `Затворено · отваря утре в ${time}${note}` : `Closed · opens tomorrow at ${time}${note}`;
  }

  const weekday = sofiaClock(new Date(now.getTime() + status.dayOffset * dayMs)).weekday;
  const name = weekdayNames[locale][weekday];
  return bg ? `Затворено · отваря в ${name} в ${time}${note}` : `Closed · opens on ${name} at ${time}${note}`;
}

/** Редовете за таблицата с часове: по един на ден, „затворено“ при липса. */
export function hoursByWeekday(hours: HourInterval[], locale: Locale) {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => {
    const intervals = hours
      .filter((row) => row.weekday === weekday)
      .sort((a, b) => toMinutes(a.opens) - toMinutes(b.opens))
      .map((row) => `${formatTime(row.opens)}–${formatTime(row.closes)}`);

    return {
      weekday,
      name: weekdayNames[locale][weekday],
      text: intervals.length ? intervals.join(", ") : locale === "bg" ? "затворено" : "closed",
      closed: intervals.length === 0
    };
  });
}

/** schema.org openingHoursSpecification за профила. */
export function openingHoursSpecification(hours: HourInterval[]) {
  return hours.map((row) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${schemaDays[row.weekday]}`,
    opens: row.opens.slice(0, 5),
    closes: row.closes.slice(0, 5)
  }));
}

export async function getBusinessHours(supabase: SupabaseClient<Database>, businessId: string) {
  const today = sofiaClock().date;
  const [{ data: hours }, { data: exceptions }] = await Promise.all([
    supabase.from("business_hours").select("id, business_id, weekday, opens, closes").eq("business_id", businessId).order("weekday").order("opens"),
    supabase
      .from("business_hour_exceptions")
      .select("id, business_id, date, opens, closes, is_closed, note")
      .eq("business_id", businessId)
      .gte("date", today)
      .order("date")
  ]);

  return { hours: hours ?? [], exceptions: exceptions ?? [] };
}

/** Едно място за „каква е обстановката сега“ - за портала, профила и QR менюто. */
export async function getOpeningStatus(supabase: SupabaseClient<Database>, businessId: string, locale: Locale) {
  const [{ hours, exceptions }, { data: settings }] = await Promise.all([
    getBusinessHours(supabase, businessId),
    supabase.from("business_platform_settings").select("open_override").eq("business_id", businessId).maybeSingle()
  ]);
  const status = computeOpeningStatus({ hours, exceptions, override: settings?.open_override ?? "auto" });

  return { hours, exceptions, status, label: openingStatusLabel(status, locale) };
}
