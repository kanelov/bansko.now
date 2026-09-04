import type { Photo } from "@/lib/types";

/**
 * CSV shape for the photo library: export the editable fields, let an AI or a spreadsheet
 * fill them in, then import the file back. `photo_code` is the key and is never changed.
 * `image_url` and `photo_page` are read only helpers and are ignored on import.
 */

export const photoCsvColumns = [
  "photo_code",
  "title_bg",
  "title_en",
  "description_bg",
  "description_en",
  "alt_bg",
  "alt_en",
  "caption_bg",
  "caption_en",
  "location_name",
  "category",
  "tags",
  "season",
  "date_taken",
  "year_taken",
  "price_tier",
  "slug",
  "is_published",
  "image_url",
  "photo_page"
] as const;

export type PhotoCsvColumn = (typeof photoCsvColumns)[number];

/** Columns the import writes back; the rest are informative. */
export const photoCsvEditableColumns: PhotoCsvColumn[] = [
  "title_bg",
  "title_en",
  "description_bg",
  "description_en",
  "alt_bg",
  "alt_en",
  "caption_bg",
  "caption_en",
  "location_name",
  "category",
  "tags",
  "season",
  "date_taken",
  "year_taken",
  "price_tier",
  "slug",
  "is_published"
];

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function photosToCsv(rows: Array<Record<string, unknown>>) {
  const lines = [photoCsvColumns.join(",")];
  for (const row of rows) {
    lines.push(photoCsvColumns.map((column) => csvCell(row[column])).join(","));
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Minimal RFC 4180 parser: handles quoted fields, embedded commas and line breaks. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const character = clean[index];
    if (quoted) {
      if (character === '"') {
        if (clean[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
}

const seasons = new Set(["winter", "spring", "summer", "autumn"]);

/** Turns one CSV row into a photo update; empty cells leave the current value untouched. */
export function csvRowToPhotoUpdate(row: Record<string, string>) {
  const update: Partial<Photo> = {};
  const text = (column: PhotoCsvColumn, maxLength: number) => {
    const value = (row[column] ?? "").trim();
    return value ? value.slice(0, maxLength) : null;
  };

  const assign = <K extends keyof Photo>(key: K, value: Photo[K] | null) => {
    if (value !== null) update[key] = value as Photo[K];
  };

  assign("title_bg", text("title_bg", 200));
  assign("title_en", text("title_en", 200));
  assign("description_bg", text("description_bg", 2000));
  assign("description_en", text("description_en", 2000));
  assign("alt_bg", text("alt_bg", 200));
  assign("alt_en", text("alt_en", 200));
  assign("caption_bg", text("caption_bg", 300));
  assign("caption_en", text("caption_en", 300));
  assign("location_name", text("location_name", 120));
  assign("category", text("category", 60));

  const tags = text("tags", 500);
  if (tags) {
    update.tags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 25);
  }

  const season = (text("season", 20) || "").toLowerCase();
  if (seasons.has(season)) update.season = season as Photo["season"];

  const dateTaken = text("date_taken", 20);
  if (dateTaken && /^\d{4}-\d{2}-\d{2}$/.test(dateTaken)) update.date_taken = dateTaken;

  const year = Number.parseInt(text("year_taken", 10) || "", 10);
  if (Number.isFinite(year) && year > 1900 && year < 2200) update.year_taken = year;

  const tier = (text("price_tier", 20) || "").toLowerCase();
  if (tier === "standard" || tier === "premium") update.price_tier = tier;

  const published = (text("is_published", 10) || "").toLowerCase();
  if (["true", "да", "yes", "1"].includes(published)) update.is_published = true;
  if (["false", "не", "no", "0"].includes(published)) update.is_published = false;

  return update;
}
