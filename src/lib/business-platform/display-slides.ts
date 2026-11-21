/**
 * Общото между портала (клиент) и сървъра за шаблона „Слайдове“. Без
 * server-only, за да го внасят и клиентските полета.
 */
import type { BusinessMediaType } from "@/lib/types";

/** Колко време стои слайд-снимка по подразбиране и в какви граници (секунди). */
export const slideDurationDefault = 10;
export const slideDurationMin = 3;
export const slideDurationMax = 120;

/** Най-много знака в един HTML слайд (около 200 KB). Снимките в него са адреси, не вградени файлове. */
export const slideHtmlMaxLength = 200000;

export type DisplaySlideKind = "media" | "html";

export type DisplaySlideForEdit = { kind: DisplaySlideKind; mediaId: string; html: string; title: string; subtitle: string; duration: number };

export type DisplayMediaUrls = { original: string | null; w480: string | null; w960: string | null; w1600: string | null };

/** Снимките и видеата на бизнеса, между които екранът избира. */
export type DisplayMediaOption = {
  id: string;
  mediaType: BusinessMediaType;
  alt: string | null;
  urls: DisplayMediaUrls;
  createdAt: string;
};
