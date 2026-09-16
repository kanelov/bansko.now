import type { Locale } from "@/lib/types";

/**
 * Цените на платформата са цели евроцентове. Тук са двете посоки: от полето
 * във формата към цели центове и от центове към текст за показване.
 */

/** "3,90" / "3.90" / "4" → 390 / 390 / 400. Празно → null. Невалидно → NaN. */
export function parsePriceToCents(input: string): number | null {
  const trimmed = input.trim().replace(/\s+/g, "").replace(",", ".");

  if (!trimmed) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return Number.NaN;
  }

  const [whole, fraction = ""] = trimmed.split(".");
  return Number.parseInt(whole, 10) * 100 + Number.parseInt((fraction + "00").slice(0, 2), 10);
}

/** 390 → "3,90 €" (bg) или "€3.90" (en). */
export function formatPrice(cents: number, locale: Locale = "bg") {
  const amount = (cents / 100).toFixed(2);

  if (locale === "en") {
    return `€${amount}`;
  }

  return `${amount.replace(".", ",")} €`;
}

/** Стойност за поле във формата: 390 → "3,90". */
export function centsToInput(cents: number | null | undefined) {
  return cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ",");
}
