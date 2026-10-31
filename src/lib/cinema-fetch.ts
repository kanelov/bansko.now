import "server-only";
import type { CinemaScreening } from "./cinema";
import { parseKinoArenaDay, parseKinoArenaDays, parseKinoArenaMovie } from "./cinema-parse";

/** Тегли седмичната програма от kinoarena.com (лентата с дните, 7 дни напред, по една страница на филм). */
const daysAhead = 7;
const headers = { "user-agent": "Mozilla/5.0 (compatible; BanskoNOW/1.0; +https://bansko.now)", accept: "text/html" };

async function fetchHtml(url: string) {
  const response = await fetch(url, { cache: "no-store", headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} за ${url}`);
  return response.text();
}

/** Изпълнява задачите по `limit` наведнъж, за да не натоварва сайта на киното. */
async function mapLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index]);
      }
    })
  );
  return results;
}

function sofiaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export async function fetchKinoArenaProgram(sourceUrl: string): Promise<CinemaScreening[]> {
  const base = await fetchHtml(sourceUrl);
  const today = sofiaToday();
  const until = addDays(today, daysAhead);
  const days = parseKinoArenaDays(base, sourceUrl).filter((day) => day.date >= today && day.date < until);
  if (!days.length) throw new Error("В лентата с дните няма дати за следващата седмица.");

  const perDay = await mapLimited(days, 3, async (day) => parseKinoArenaDay(await fetchHtml(day.url), day.date, sourceUrl));
  const screenings = perDay.flat();

  // Подробности по филм: една страница на уникален адрес, грешката по един филм не спира останалите.
  const movieUrls = Array.from(new Set(screenings.map((item) => item.url).filter((url): url is string => Boolean(url))));
  const details = new Map<string, ReturnType<typeof parseKinoArenaMovie>>();
  await mapLimited(movieUrls, 4, async (url) => {
    try {
      details.set(url, parseKinoArenaMovie(await fetchHtml(url)));
    } catch {
      // без подробности, прожекциите остават
    }
  });
  return screenings.map((item) => ({ ...item, ...(item.url ? details.get(item.url) ?? {} : {}) }));
}

