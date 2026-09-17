/**
 * Настройките на менюто за печат. Не се пазят в базата: порталът ги праща като
 * параметри в адреса на страницата за печат, а тук се проверяват срещу списък с
 * позволени стойности. Чист файл без зависимости - ползва се и от формата в
 * портала, и от самата страница.
 */

export type PrintSize = "a4" | "a3" | "a5" | "dl";
export type PrintOrientation = "portrait" | "landscape";
export type PrintLanguage = "bg" | "en" | "both";
export type PrintStyle = "light" | "dark";
export type PrintMargin = "office" | "bleed";

export type PrintOptions = {
  size: PrintSize;
  orientation: PrintOrientation;
  language: PrintLanguage;
  style: PrintStyle;
  margin: PrintMargin;
  backgroundId: string | null;
  categoryIds: string[];
  descriptions: boolean;
  qr: boolean;
};

export const printSizes: { value: PrintSize; label: string; hint: string; width: number; height: number; landscape: boolean }[] = [
  { value: "a4", label: "A4", hint: "210 × 297 mm – лист за офис принтер", width: 210, height: 297, landscape: true },
  { value: "a3", label: "A3", hint: "297 × 420 mm – табло на стената", width: 297, height: 420, landscape: true },
  { value: "a5", label: "A5", hint: "148 × 210 mm – малко меню за маса", width: 148, height: 210, landscape: false },
  { value: "dl", label: "DL", hint: "99 × 210 mm – тясно меню за стойка", width: 99, height: 210, landscape: false }
];

export const printLanguages: { value: PrintLanguage; label: string }[] = [
  { value: "bg", label: "Български" },
  { value: "en", label: "English" },
  { value: "both", label: "Двуезично" }
];

/** 3 mm от всяка страна: колкото печатницата реже. */
export const bleedMm = 3;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RawParams = Record<string, string | string[] | undefined>;

function one(params: RawParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function many(params: RawParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parsePrintOptions(params: RawParams): PrintOptions {
  const size = pick(one(params, "size"), ["a4", "a3", "a5", "dl"] as const, "a4");
  const allowsLandscape = printSizes.find((item) => item.value === size)?.landscape ?? false;
  const orientation = allowsLandscape ? pick(one(params, "orientation"), ["portrait", "landscape"] as const, "portrait") : "portrait";
  const background = one(params, "bg");
  /* Отметката праща qr=0 и qr=1 заедно (скрито поле + checkbox); без параметър кодът се печата. */
  const qrValues = many(params, "qr");

  return {
    size,
    orientation,
    language: pick(one(params, "lang"), ["bg", "en", "both"] as const, "bg"),
    style: pick(one(params, "style"), ["light", "dark"] as const, "light"),
    margin: pick(one(params, "margin"), ["office", "bleed"] as const, "office"),
    backgroundId: uuidPattern.test(background) ? background : null,
    categoryIds: many(params, "cat").filter((value) => uuidPattern.test(value)).slice(0, 40),
    descriptions: one(params, "desc") === "1",
    qr: qrValues.length === 0 || qrValues.includes("1")
  };
}

/** Размерът на листа в милиметри, с обръщането и с добавката за рязане. */
export function sheetDimensions(options: Pick<PrintOptions, "size" | "orientation" | "margin">) {
  const base = printSizes.find((item) => item.value === options.size) ?? printSizes[0];
  const portrait = options.orientation === "portrait";
  const extra = options.margin === "bleed" ? bleedMm * 2 : 0;

  return {
    width: (portrait ? base.width : base.height) + extra,
    height: (portrait ? base.height : base.width) + extra,
    bleed: options.margin === "bleed" ? bleedMm : 0
  };
}

/** Колко колони носи листът: по ширината му, без да пита собственика. */
export function printColumnCount(widthMm: number) {
  if (widthMm < 130) return 1;
  if (widthMm < 250) return 2;
  if (widthMm < 360) return 3;
  return 4;
}
