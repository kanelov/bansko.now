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
  availability: "in_stock" | "out_of_stock" | "preorder" | "in_gallery_only" | "catalog_only";
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

export type GalleryProductLink = {
  id: string;
  title: string;
  slug: string;
};

type GalleryProductContext = {
  can_request: boolean;
  previous_product: GalleryProductLink | null;
  next_product: GalleryProductLink | null;
  variants: GalleryCatalogVariant[];
};

export type GalleryCatalog = {
  generated_at: string;
  page: number;
  page_size: number;
  total_count: number;
  page_count: number;
  categories: GalleryCatalogCategory[];
  products: GalleryCatalogProduct[];
};

export type LocalizedGalleryCategory = GalleryCatalogCategory & GalleryCategoryTranslation;
export type LocalizedGalleryProduct = GalleryCatalogProduct & GalleryCatalogTranslation & {
  alternate_slug: string | null;
  localized_categories: LocalizedGalleryCategory[];
  previous_product: GalleryProductLink | null;
  next_product: GalleryProductLink | null;
};

const emptyCatalog: GalleryCatalog = {
  generated_at: new Date(0).toISOString(),
  page: 1,
  page_size: 24,
  total_count: 0,
  page_count: 0,
  categories: [],
  products: []
};

export type GalleryCatalogQuery = {
  locale?: Locale;
  page?: number;
  pageSize?: number;
  categorySlug?: string | null;
  productSlug?: string | null;
  catalogId?: string | null;
  query?: string | null;
};

type NextFetchInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

async function integrationFetch(url: string, init?: NextFetchInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (artGalleryIntegrationSecret) {
    headers.set("Authorization", `Bearer ${artGalleryIntegrationSecret}`);
  }
  return fetch(url, {
    ...init,
    headers
  });
}

function reservationIntegrationAvailable() {
  return Boolean(artGalleryReservationApiUrl && artGalleryIntegrationSecret);
}

function catalogRequestUrl(query: GalleryCatalogQuery) {
  if (!artGalleryCatalogApiUrl) return null;
  const url = new URL(artGalleryCatalogApiUrl);
  url.searchParams.set("locale", query.locale === "en" ? "en" : "bg");
  if (query.page && query.page > 1) url.searchParams.set("page", String(query.page));
  if (query.pageSize) url.searchParams.set("page_size", String(query.pageSize));
  if (query.categorySlug) url.searchParams.set("category", query.categorySlug);
  if (query.productSlug) url.searchParams.set("slug", query.productSlug);
  if (query.catalogId) url.searchParams.set("id", query.catalogId);
  if (query.query) url.searchParams.set("q", query.query);
  return url.toString();
}

export async function getGalleryCatalog(query: GalleryCatalogQuery = {}): Promise<GalleryCatalog> {
  const url = catalogRequestUrl(query);
  if (!url) return emptyCatalog;

  try {
    const response = await integrationFetch(url, {
      next: { revalidate: 300, tags: ["art-gallery-catalog"] }
    });
    if (!response?.ok) return emptyCatalog;
    const catalog = (await response.json()) as GalleryCatalog;
    if (!Array.isArray(catalog.products) || !Array.isArray(catalog.categories)) return emptyCatalog;
    return {
      ...emptyCatalog,
      ...catalog,
      page: Number(catalog.page) || 1,
      page_size: Number(catalog.page_size) || query.pageSize || 24,
      total_count: Number(catalog.total_count) || 0,
      page_count: Number(catalog.page_count) || 0
    };
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

export async function getLocalizedGalleryCatalog(
  locale: Locale,
  query: Omit<GalleryCatalogQuery, "locale"> = {}
) {
  const catalog = await getGalleryCatalog({ ...query, locale });
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
      can_reserve: product.can_reserve && reservationIntegrationAvailable(),
      alternate_slug: alternate?.slug ?? null,
      previous_product: null,
      next_product: null,
      localized_categories: product.categories
        .map((item) => categoryById.get(item.id))
        .filter((category): category is LocalizedGalleryCategory => Boolean(category))
    } satisfies LocalizedGalleryProduct];
  });

  return {
    generatedAt: catalog.generated_at,
    page: catalog.page,
    pageSize: catalog.page_size,
    totalCount: catalog.total_count,
    pageCount: catalog.page_count,
    categories,
    products
  };
}

async function getGalleryProductContext(id: string, locale: Locale): Promise<GalleryProductContext | null> {
  if (!artGalleryCatalogApiUrl) return null;
  const url = new URL(artGalleryCatalogApiUrl);
  url.searchParams.set("locale", locale);
  url.searchParams.set("context_for", id);

  try {
    const response = await integrationFetch(url.toString(), {
      next: { revalidate: 300, tags: ["art-gallery-catalog"] }
    });
    if (!response.ok) return null;
    const context = (await response.json()) as GalleryProductContext;
    return Array.isArray(context.variants) ? context : null;
  } catch (error) {
    console.error("[gallery product context unavailable]", error);
    return null;
  }
}

async function withProductContext(product: LocalizedGalleryProduct | null, locale: Locale) {
  if (!product) return null;
  const context = await getGalleryProductContext(product.id, locale);
  if (!context) return product;
  return {
    ...product,
    variants: context.variants,
    can_reserve: context.can_request && reservationIntegrationAvailable(),
    previous_product: context.previous_product,
    next_product: context.next_product
  } satisfies LocalizedGalleryProduct;
}

export async function getGalleryProductBySlug(slug: string, locale: Locale) {
  const { products } = await getLocalizedGalleryCatalog(locale, { productSlug: slug, pageSize: 1 });
  return withProductContext(products.find((product) => product.slug === slug) ?? null, locale);
}

export async function getGalleryProductById(id: string, locale: Locale) {
  const { products } = await getLocalizedGalleryCatalog(locale, { catalogId: id, pageSize: 1 });
  return withProductContext(products.find((product) => product.id === id) ?? null, locale);
}

export async function getAllLocalizedGalleryProducts(locale: Locale) {
  const first = await getLocalizedGalleryCatalog(locale, { page: 1, pageSize: 100 });
  if (first.pageCount <= 1) return first.products;
  const remaining = await Promise.all(
    Array.from({ length: first.pageCount - 1 }, (_, index) =>
      getLocalizedGalleryCatalog(locale, { page: index + 2, pageSize: 100 })
    )
  );
  return [first.products, ...remaining.map((page) => page.products)].flat();
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
