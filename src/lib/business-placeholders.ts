import { cache } from "react";
import type { Business, BusinessWithRelations } from "@/lib/types";

/*
 * Шаблонни илюстрации за бизнеси без собствена снимка (docs/biznes-shabloni-snimki.md).
 * Една обща рисувана илюстрация за всяка от десетте категории, качена в Cloudflare R2 под
 * business/placeholders/placeholder-<slug>.webp. Нищо не се записва в профила: адресът се
 * попълва при четене (`placeholder_image_url`) и отпада сам, щом бизнесът получи истинска снимка.
 * Липсваща илюстрация (още не е качена) се открива с една HEAD заявка на ден към CDN-а и тогава
 * картата показва цветния панел както досега.
 */

export const businessPlaceholderBaseUrl = "https://cdn.bansko.now/business/placeholders";

export const businessPlaceholderSlugs = [
  "restaurants",
  "cafes",
  "hotels",
  "guest-houses",
  "services",
  "shops",
  "activities",
  "health-sport",
  "transport",
  "culture"
] as const;

export type BusinessPlaceholderSlug = (typeof businessPlaceholderSlugs)[number];

/* Резервна връзка по българското име на категорията (колоната `businesses.category`), когато `category_id` липсва. */
const placeholderSlugByCategoryName: Record<string, BusinessPlaceholderSlug> = {
  Ресторанти: "restaurants",
  Restaurants: "restaurants",
  Кафета: "cafes",
  Cafés: "cafes",
  Cafes: "cafes",
  Хотели: "hotels",
  Hotels: "hotels",
  "Къщи за гости": "guest-houses",
  "Guest houses": "guest-houses",
  Услуги: "services",
  Services: "services",
  Магазини: "shops",
  Shops: "shops",
  Активности: "activities",
  Activities: "activities",
  "Здраве и спорт": "health-sport",
  "Health & sport": "health-sport",
  Транспорт: "transport",
  Transport: "transport",
  Култура: "culture",
  Culture: "culture"
};

export function businessPlaceholderUrl(slug: string) {
  return `${businessPlaceholderBaseUrl}/placeholder-${slug}.webp`;
}

export function isBusinessPlaceholderUrl(url: string | null | undefined) {
  return Boolean(url && url.startsWith(`${businessPlaceholderBaseUrl}/`));
}

function isPlaceholderSlug(value: string | null | undefined): value is BusinessPlaceholderSlug {
  return Boolean(value && (businessPlaceholderSlugs as readonly string[]).includes(value));
}

/** Slug на категорията за шаблона: първо по `category_id` (подадената карта id → slug), после по името. */
export function resolveBusinessPlaceholderSlug(
  business: Pick<Business, "category" | "category_id">,
  categorySlugById: ReadonlyMap<string, string>
): BusinessPlaceholderSlug | null {
  const bySlug = business.category_id ? categorySlugById.get(business.category_id) : undefined;
  if (isPlaceholderSlug(bySlug)) return bySlug;
  const byName = placeholderSlugByCategoryName[business.category?.trim() ?? ""];
  return byName ?? null;
}

async function placeholderExists(slug: BusinessPlaceholderSlug) {
  try {
    const response = await fetch(businessPlaceholderUrl(slug), {
      method: "HEAD",
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Кои от десетте илюстрации са налични на CDN-а. Кеширано за деня (една HEAD заявка на категория). */
export const getAvailableBusinessPlaceholders = cache(async (): Promise<ReadonlySet<BusinessPlaceholderSlug>> => {
  const checks = await Promise.all(businessPlaceholderSlugs.map(async (slug) => [slug, await placeholderExists(slug)] as const));
  return new Set(checks.filter(([, ok]) => ok).map(([slug]) => slug));
});

/** Чиста функция: връща бизнеса с `placeholder_image_url`, когато няма своя снимка и илюстрацията е налична. */
export function withBusinessPlaceholder<T extends BusinessWithRelations>(
  business: T,
  categorySlugById: ReadonlyMap<string, string>,
  available: ReadonlySet<string>
): T {
  if (business.images?.length) {
    return { ...business, placeholder_image_url: null };
  }
  const slug = resolveBusinessPlaceholderSlug(business, categorySlugById);
  const placeholder_image_url = slug && available.has(slug) ? businessPlaceholderUrl(slug) : null;
  return { ...business, placeholder_image_url };
}

/** Първата снимка за показване: своя или шаблонната. */
export function businessPrimaryImage(business: Pick<BusinessWithRelations, "images" | "placeholder_image_url">) {
  return business.images?.[0] ?? business.placeholder_image_url ?? null;
}
