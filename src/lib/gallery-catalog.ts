import "server-only";

import {
  artGalleryCatalogApiUrl,
  artGalleryIntegrationSecret,
  artGalleryReservationApiUrl
} from "@/lib/env";
import type { Locale } from "@/lib/types";

export type GalleryCatalogTranslation = {
  catalog_id: string;
  locale: Locale;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  material: string;
  image_alt: string;
  image_caption: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  robots_index: boolean;
  robots_follow: boolean;
};

export type GalleryCategoryTranslation = {
  category_id: string;
  locale: Locale;
  name: string;
  slug: string;
  description: string;
  image_alt: string;
  seo_title: string;
  seo_description: string;
};

export type GalleryCatalogCategory = {
  id: string;
  parent_id: string | null;
  image_url: string;
  sort_order: number;
  translations: GalleryCategoryTranslation[];
};

export type GalleryCatalogVariant = {
  id: string;
  label: string;
  sort_order: number;
  quantity_available: number;
  product_type: { id: string; name: string; sort_order: number } | null;
};

export type GalleryCatalogProduct = {
  id: string;
  sku: string;
  fallback_name: string;
  image_urls: string[];
  price: number | null;
  currency: "BGN" | "EUR";
  availability: "in_stock" | "out_of_stock" | "preorder" | "in_gallery_only";
  brand: string;
  item_condition: "new" | "used" | "refurbished";
  is_featured: boolean;
  sort_order: number;
  updated_at: string;
  can_reserve: boolean;
  online_order_enabled: boolean;
  woocommerce_url: string;
  categories: { id: string; sort_order: number }[];
  variants: GalleryCatalogVariant[];
  translations: GalleryCatalogTranslation[];
};

export type GalleryCatalog = {
  generated_at: string;
  categories: GalleryCatalogCategory[];
  products: GalleryCatalogProduct[];
};

export type LocalizedGalleryCategory = GalleryCatalogCategory & GalleryCategoryTranslation;
export type LocalizedGalleryProduct = GalleryCatalogProduct & GalleryCatalogTranslation & {
  alternate_slug: string | null;
  localized_categories: LocalizedGalleryCategory[];
};

const emptyCatalog: GalleryCatalog = {
  generated_at: new Date(0).toISOString(),
  categories: [],
  products: []
};

type NextFetchInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

async function integrationFetch(url: string, init?: NextFetchInit) {
  if (!artGalleryIntegrationSecret) return null;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${artGalleryIntegrationSecret}`,
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
}

export async function getGalleryCatalog(): Promise<GalleryCatalog> {
  if (!artGalleryCatalogApiUrl || !artGalleryIntegrationSecret) return emptyCatalog;

  try {
    const response = await integrationFetch(artGalleryCatalogApiUrl, {
      next: { revalidate: 300, tags: ["art-gallery-catalog"] }
    });
    if (!response?.ok) return emptyCatalog;
    const catalog = (await response.json()) as GalleryCatalog;
    return Array.isArray(catalog.products) && Array.isArray(catalog.categories)
      ? catalog
      : emptyCatalog;
  } catch (error) {
    console.error("[gallery catalog unavailable]", error);
    return emptyCatalog;
  }
}

function localizeCategory(category: GalleryCatalogCategory, locale: Locale) {
  const translation = category.translations.find((item) => item.locale === locale);
  if (!translation?.name || !translation.slug) return null;
  return { ...category, ...translation } satisfies LocalizedGalleryCategory;
}

export async function getLocalizedGalleryCatalog(locale: Locale) {
  const catalog = await getGalleryCatalog();
  const categories = catalog.categories
    .map((category) => localizeCategory(category, locale))
    .filter((category): category is LocalizedGalleryCategory => Boolean(category))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const products = catalog.products.flatMap((product) => {
    const translation = product.translations.find((item) => item.locale === locale);
    if (!translation?.title || !translation.slug) return [];
    const alternate = product.translations.find((item) => item.locale !== locale && item.title && item.slug);
    return [{
      ...product,
      ...translation,
      alternate_slug: alternate?.slug ?? null,
      localized_categories: product.categories
        .map((item) => categoryById.get(item.id))
        .filter((category): category is LocalizedGalleryCategory => Boolean(category))
    } satisfies LocalizedGalleryProduct];
  });

  return { generatedAt: catalog.generated_at, categories, products };
}

export async function getGalleryProductBySlug(slug: string, locale: Locale) {
  const { products } = await getLocalizedGalleryCatalog(locale);
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getGalleryProductById(id: string, locale: Locale) {
  const { products } = await getLocalizedGalleryCatalog(locale);
  return products.find((product) => product.id === id) ?? null;
}

export type GalleryReservationInput = {
  client_request_id: string;
  catalog_id: string;
  variant_id: string | null;
  locale: Locale;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  quantity: number;
  note: string;
};

export type GalleryReservation = {
  id: string;
  reservation_code: string;
  status: string;
  expires_at: string;
};

export async function createGalleryReservation(input: GalleryReservationInput) {
  if (!artGalleryReservationApiUrl || !artGalleryIntegrationSecret) {
    throw new Error("Gallery reservation integration is not configured");
  }

  const response = await integrationFetch(artGalleryReservationApiUrl, {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify(input)
  });
  if (!response?.ok) {
    const body = await response?.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || "Gallery reservation failed");
  }

  const body = await response.json() as { reservation?: GalleryReservation };
  if (!body.reservation?.reservation_code) throw new Error("Missing reservation number");
  return body.reservation;
}
