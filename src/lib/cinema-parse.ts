import type { CinemaScreening } from "./cinema";

/**
 * Парсер на програмата от kinoarena.com (сайтът е на Stenik; без DOM библиотека, само регулярни изрази,
 * защото структурата е проста и стабилна):
 *  - `/bg/program/view/<кино>`: лента с дни `a.tabItem[href=…/DD-MM-YYYY]`; страницата показва един ден;
 *  - `/bg/program/view/<кино>/DD-MM-YYYY`: редове `.scheduleRow` с `h5.title a` (заглавие + адрес на филма),
 *    атрибути `data-title` (Digital, 3D, BG Subtitles, Dubbed) и часове `a.booking span.time`;
 *  - `/bg/movie/<slug>`: „Времетраене“, „Жанр“, „Категория“ (буква + текст).
 * Взимат се само факти. Постери и синопсиси не се четат.
 */

export type KinoArenaDay = { date: string; url: string };

export type KinoArenaMovieDetails = {
  duration_min: number | null;
  genre: string | null;
  age: string | null;
};

const entities: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#039;": "'", "&#39;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };

function decode(text: string) {
  return text.replace(/&(amp|quot|#039|#39|lt|gt|nbsp);/g, (match) => entities[match] ?? match).replace(/\s+/g, " ").trim();
}

function stripTags(html: string) {
  return decode(html.replace(/<[^>]+>/g, " "));
}

function absolute(href: string, sourceUrl: string) {
  try {
    return new URL(href, sourceUrl).toString();
  } catch {
    return null;
  }
}

/** Дните от лентата над програмата, като YYYY-MM-DD + адрес на деня. */
export function parseKinoArenaDays(html: string, sourceUrl: string): KinoArenaDay[] {
  const days: KinoArenaDay[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<a href="([^"]*\/(\d{2})-(\d{2})-(\d{4}))"[^>]*class="tabItem[^"]*"/g)) {
    const date = `${match[4]}-${match[3]}-${match[2]}`;
    const url = absolute(match[1], sourceUrl);
    if (!url || seen.has(date)) continue;
    seen.add(date);
    days.push({ date, url });
  }
  return days;
}

function attributeLabels(block: string) {
  const titles = Array.from(block.matchAll(/data-title="([^"]+)"/g)).map((match) => decode(match[1]).toLowerCase());
  const format = titles.find((title) => /3d|imax|4dx|dolby|atmos/.test(title));
  let language: string | null = null;
  if (titles.some((title) => /dubbed|дублир/.test(title))) language = "дублаж";
  else if (titles.some((title) => /subtitle|субтитр/.test(title))) language = "субтитри";
  return { format: format ? format.toUpperCase().replace("DIGITAL", "").trim() || null : null, language };
}

/** Прожекциите от страницата на един ден. */
export function parseKinoArenaDay(html: string, date: string, sourceUrl: string): CinemaScreening[] {
  const rows = html.split(/<div class="scheduleRow">/).slice(1);
  const screenings: CinemaScreening[] = [];
  for (const row of rows) {
    const block = row.split(/end of \.contentWrapper|<div class="scheduleRow">/)[0];
    const title = block.match(/<h5 class="title">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!title) continue;
    const times: CinemaScreening["times"] = [];
    const seen = new Set<string>();
    for (const slot of block.matchAll(/<a href="([^"]*)"[^>]*class="item booking"[^>]*>\s*<span class="time">\s*(\d{1,2}:\d{2})\s*<\/span>/g)) {
      const time = slot[2].padStart(5, "0");
      if (seen.has(time)) continue;
      seen.add(time);
      times.push({ time, hall: null, url: absolute(slot[1], sourceUrl) });
    }
    if (!times.length) continue;
    times.sort((a, b) => a.time.localeCompare(b.time));
    const attributes = attributeLabels(block);
    screenings.push({
      date,
      title: stripTags(title[2]),
      original_title: null,
      url: absolute(title[1], sourceUrl),
      times,
      format: attributes.format,
      language: attributes.language,
      age: null,
      duration_min: null,
      genre: null
    });
  }
  return screenings;
}

const ageLabels: Record<string, string | null> = { A: "за деца", B: null };

/** Продължителност, жанр и възрастова категория от страницата на филма. */
export function parseKinoArenaMovie(html: string): KinoArenaMovieDetails {
  const field = (label: string) => {
    const match = html.match(new RegExp(`<div class="table--key">\\s*${label}\\s*</div>\\s*<div class="table--value">([\\s\\S]*?)</div>`));
    return match ? stripTags(match[1]) : null;
  };
  const duration = field("Времетраене")?.match(/(\d{2,3})/);
  const genre = field("Жанр");
  let age: string | null = null;
  const censor = html.match(/<div class="table--item censor--attributes">[\s\S]{0,1500}?<img[^>]*title="([^"]*)"[\s\S]{0,600}?<p>([\s\S]*?)<\/p>/);
  if (censor) {
    const text = stripTags(censor[2]);
    const years = text.match(/под\s*(\d{1,2})/i);
    const letter = decode(censor[1]).toUpperCase().replace("С", "C");
    age = years ? `${years[1]}+` : letter in ageLabels ? ageLabels[letter] : letter || null;
  }
  return { duration_min: duration ? Number.parseInt(duration[1], 10) : null, genre: genre || null, age };
}
