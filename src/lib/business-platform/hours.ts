import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessHour, BusinessHourException, BusinessOpenOverride, Database, Locale } from "@/lib/types";

/**
 * Работно време на един бизнес и отговорът на въпроса „отворено ли е сега“.
 *
 * Правилата са на едно място, защото на четири страници не бива да се смятат
 * четири пъти: ред в business_hours е интервал, в който е отворено (два реда =
 * две смени), ден без ред е затворен, изключението по дата бие седмичния ред, а
 * ръчният превключвател (open_override) бие всичко. Часовете са местни за
 * заведението - сметката е винаги в Europe/Sofia, независимо къде е сървърът.
 */

export const businessTimeZone = "Europe/Sofia";

export type HourInterval = { opens: string; closes: string };

/** Седмицата: по един запис на ден от понеделник (1) до неделя (7). */
export type WeekdayHours = { weekday: number; intervals: HourInterval[] };

export type BusinessHours = {
  week: WeekdayHours[];
  exceptions: BusinessHourException[];
};

export type OpenState =
  | { state: "open"; until: string | null; reason: "schedule" | "override" | "exception"; note?: string | null }
  | { state: "closed"; nextOpen: { weekday: number; opens: string; isToday: boolean } | null; reason: "schedule" | "override" | "exception"; note?: string | null }
  | { state: "unknown" };

type Client = SupabaseClient<Database>;

export function emptyWeek(): WeekdayHours[] {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, intervals: [] }));
}

/** „07:30:00“ и „07:30“ се срещат и двете; на екрана винаги излиза „07:30“. */
export function formatTime(value: string) {
  return value.slice(0, 5);
}

export function toMinutes(value: string) {
  const [hours, minutes] = formatTime(value).split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function buildWeek(rows: Pick<BusinessHour, "weekday" | "opens" | "closes">[]): WeekdayHours[] {
  const week = emptyWeek();

  for (const row of rows) {
    const day = week.find((entry) => entry.weekday === row.weekday);
    if (!day) continue;
    day.intervals.push({ opens: formatTime(row.opens), closes: formatTime(row.closes) });
  }

  for (const day of week) {
    day.intervals.sort((a, b) => toMinutes(a.opens) - toMinutes(b.opens));
  }

  return week;
}

/**
 * Часовете на бизнеса. Изключенията се четат от вчера нататък: вчерашното още
 * има значение за интервал, който минава през полунощ.
 */
export async function getBusinessHours(supabase: Client, businessId: string, options: { now?: Date } = {}): Promise<BusinessHours> {
  const today = sofiaDate(options.now ?? new Date());

  const [hours, exceptions] = await Promise.all([
    supabase.from("business_hours").select("weekday, opens, closes").eq("business_id", businessId).order("weekday").order("opens"),
    supabase
      .from("business_hour_exceptions")
      .select("id, business_id, date, opens, closes, is_closed, note, created_at, updated_at")
      .eq("business_id", businessId)
      .gte("date", shiftDate(today, -1))
      .order("date")
      .limit(60)
  ]);

  return { week: buildWeek(hours.data ?? []), exceptions: (exceptions.data ?? []) as BusinessHourException[] };
}

/** Днешната дата в Банско като „2026-09-16“. */
export function sofiaDate(now: Date) {
  const parts = sofiaParts(now);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function sofiaNow(now: Date) {
  const parts = sofiaParts(now);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

function sofiaParts(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short"
  });

  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const weekdays: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    weekday: weekdays[parts.weekday ?? "Mon"] ?? 1
  };
}

/** Дата + брой дни, без часови зони: работим само с „2026-09-16“. */
export function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function intervalsForDate(hours: BusinessHours, date: string, weekday: number): { intervals: HourInterval[]; exception: BusinessHourException | null } {
  const exception = hours.exceptions.find((item) => item.date === date) ?? null;

  if (exception) {
    if (exception.is_closed || !exception.opens || !exception.closes) {
      return { intervals: [], exception };
    }

    return { intervals: [{ opens: formatTime(exception.opens), closes: formatTime(exception.closes) }], exception };
  }

  return { intervals: hours.week.find((day) => day.weekday === weekday)?.intervals ?? [], exception: null };
}

function previousWeekday(weekday: number) {
  return weekday === 1 ? 7 : weekday - 1;
}

function nextWeekday(weekday: number) {
  return weekday === 7 ? 1 : weekday + 1;
}

/**
 * Отворено ли е сега. Ръчният превключвател бие всичко (собственикът затваря за
 * ден с едно докосване), после изключението по дата, после седмичният ред.
 */
export function resolveOpenState(
  hours: BusinessHours,
  override: BusinessOpenOverride,
  now: Date = new Date()
): OpenState {
  if (override === "open") {
    return { state: "open", until: null, reason: "override" };
  }

  if (override === "closed") {
    return { state: "closed", nextOpen: null, reason: "override" };
  }

  const hasSchedule = hours.week.some((day) => day.intervals.length > 0) || hours.exceptions.length > 0;

  if (!hasSchedule) {
    return { state: "unknown" };
  }

  const current = sofiaNow(now);
  const today = intervalsForDate(hours, current.date, current.weekday);

  for (const interval of today.intervals) {
    const opens = toMinutes(interval.opens);
    const closes = toMinutes(interval.closes);
    const overnight = closes <= opens;

    if (current.minutes >= opens && (overnight || current.minutes < closes)) {
      return {
        state: "open",
        until: interval.closes,
        reason: today.exception ? "exception" : "schedule",
        note: today.exception?.note ?? null
      };
    }
  }

  /* Вчерашният интервал през полунощ: отворено е, но денят е сменен. */
  const yesterday = intervalsForDate(hours, shiftDate(current.date, -1), previousWeekday(current.weekday));

  for (const interval of yesterday.intervals) {
    const opens = toMinutes(interval.opens);
    const closes = toMinutes(interval.closes);

    if (closes <= opens && current.minutes < closes) {
      return { state: "open", until: interval.closes, reason: yesterday.exception ? "exception" : "schedule", note: yesterday.exception?.note ?? null };
    }
  }

  return {
    state: "closed",
    nextOpen: findNextOpen(hours, current),
    reason: today.exception ? "exception" : "schedule",
    note: today.exception?.note ?? null
  };
}

function findNextOpen(hours: BusinessHours, current: { date: string; weekday: number; minutes: number }) {
  let date = current.date;
  let weekday = current.weekday;

  for (let offset = 0; offset < 8; offset += 1) {
    const day = intervalsForDate(hours, date, weekday);

    for (const interval of day.intervals) {
      const opens = toMinutes(interval.opens);
      if (offset > 0 || opens > current.minutes) {
        return { weekday, opens: interval.opens, isToday: offset === 0 };
      }
    }

    date = shiftDate(date, 1);
    weekday = nextWeekday(weekday);
  }

  return null;
}

/* ---------------------------------------------------------------- показване */

const weekdayNames: Record<Locale, string[]> = {
  bg: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота", "Неделя"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
};

const weekdayShort: Record<Locale, string[]> = {
  bg: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
};

export function weekdayName(weekday: number, locale: Locale) {
  return weekdayNames[locale][weekday - 1] ?? "";
}

export function weekdayAbbreviation(weekday: number, locale: Locale) {
  return weekdayShort[locale][weekday - 1] ?? "";
}

export function formatIntervals(intervals: HourInterval[], locale: Locale) {
  if (intervals.length === 0) {
    return locale === "en" ? "Closed" : "Почивен ден";
  }

  return intervals.map((interval) => `${formatTime(interval.opens)} – ${formatTime(interval.closes)}`).join(", ");
}

/** Еднаквите съседни дни се сливат: „Пн – Сб · 07:30 – 23:30“. */
export function groupWeek(week: WeekdayHours[], locale: Locale) {
  const rows: { label: string; value: string }[] = [];
  let start: WeekdayHours | null = null;
  let previous: WeekdayHours | null = null;

  const flush = () => {
    if (!start || !previous) return;
    const label =
      start.weekday === previous.weekday
        ? weekdayName(start.weekday, locale)
        : `${weekdayAbbreviation(start.weekday, locale)} – ${weekdayAbbreviation(previous.weekday, locale)}`;
    rows.push({ label, value: formatIntervals(start.intervals, locale) });
  };

  for (const day of week) {
    const sameAsPrevious = previous && formatIntervals(day.intervals, locale) === formatIntervals(previous.intervals, locale);

    if (!sameAsPrevious) {
      flush();
      start = day;
    }

    previous = day;
  }

  flush();
  return rows;
}

/** schema.org: само дните с часове; денонощното „00:00 – 00:00“ не се ползва. */
export function openingHoursSpecification(week: WeekdayHours[]) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return week.flatMap((day) =>
    day.intervals.map((interval) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${days[day.weekday - 1]}`,
      opens: formatTime(interval.opens),
      closes: formatTime(interval.closes)
    }))
  );
}
