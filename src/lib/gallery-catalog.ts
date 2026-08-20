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
  direct_product_count: number;
  product_count: number;
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
  directOnly?: boolean;
};

export type GallerySitemapProduct = {
  id: string;
  updated_at: string;
  image_url: string;
  translations: Array<{
    locale: Locale;
    title: string;
    slug: string;
    image_alt: string;
    image_caption: string;
    robots_index: boolean;
  }>;
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

function catalogRequestUrl(query: GalleryCatalogQuery, mode?: "cards" | "categories" | "sitemap") {
  if (!artGalleryCatalogApiUrl) return null;
  const url = new URL(artGalleryCatalogApiUrl);
  url.searchParams.set("locale", query.locale === "en" ? "en" : "bg");
  if (mode) url.searchParams.set("mode", mode);
  if (query.page && query.page > 1) url.searchParams.set("page", String(query.page));
  if (query.pageSize) url.searchParams.set("page_size", String(query.pageSize));
  if (query.categorySlug) url.searchParams.set("category", query.categorySlug);
  if (query.productSlug) url.searchParams.set("slug", query.productSlug);
  if (query.catalogId) url.searchParams.set("id", query.catalogId);
  if (query.query) url.searchParams.set("q", query.query);
  if (query.directOnly) url.searchParams.set("direct", "1");
  return url.toString();
}

export async function getGalleryCatalog(query: GalleryCatalogQuery = {}): Promise<GalleryCatalog> {
  const isDetailRequest = Boolean(query.productSlug || query.catalogId);
  const url = catalogRequestUrl(query, isDetailRequest ? undefined : "cards");
  if (!url) return emptyCatalog;

  try {
    const response = await integrationFetch(url, {
      next: { revalidate: 900, tags: ["art-gallery-catalog"] }
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

export async function getGalleryCategories(locale: Locale) {
  const url = catalogRequestUrl({ locale }, "categories");
  if (!url) return [] as GalleryCatalogCategory[];

  try {
    const response = await integrationFetch(url, {
      next: { revalidate: 900, tags: ["art-gallery-catalog"] }
    });
    if (!response.ok) return [] as GalleryCatalogCategory[];
    const payload = await response.json() as { categories?: GalleryCatalogCategory[] };
    return Array.isArray(payload.categories) ? payload.categories : [];
  } catch (error) {
    console.error("[gallery categories unavailable]", error);
    return [] as GalleryCatalogCategory[];
  }
}

export async function getGallerySitemapProducts() {
  const url = catalogRequestUrl({ locale: "bg" }, "sitemap");
  if (!url) return [] as GallerySitemapProduct[];

  try {
    const response = await integrationFetch(url, {
      next: { revalidate: 86400, tags: ["art-gallery-sitemap"] }
    });
    if (!response.ok) return [] as GallerySitemapProduct[];
    const payload = await response.json() as { products?: GallerySitemapProduct[] };
    return Array.isArray(payload.products) ? payload.products : [];
  } catch (error) {
    console.error("[gallery sitemap unavailable]", error);
    return [] as GallerySitemapProduct[];
  }
}

function localizeCategory(category: GalleryCatalogCategory, locale: Locale) {
  const translation = category.translations.find((item) => item.locale === locale);
  if (!translation?.name || !translation.slug) return null;
  return { ...category, ...translation } satisfies LocalizedGalleryCategory;
}

export async function getLocalizedGalleryCategories(locale: Locale) {
  const categories = await getGalleryCategories(locale);
  return categories
    .map((category) => localizeCategory(category, locale))
    .filter((category): category is LocalizedGalleryCategory => Boolean(category))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export async function getLocalizedGalleryCatalog(
  locale: Locale,
  query: Omit<GalleryCatalogQuery, "locale"> = {}
) {
  const [catalog, categories] = await Promise.all([
    getGalleryCatalog({ ...query, locale }),
    getLocalizedGalleryCategories(locale)
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const products = catalog.products.flatMap((product) => {
    const translation = product.translations.find((item) => item.locale === locale);
    if (!translation?.title || !translation.slug) return [];
    const alternate = product.translations.find((item) => item.locale !== locale && item.title && item.slug);
    const normalizedTranslation: GalleryCatalogTranslation = {
      catalog_id: product.id,
      locale,
      title: translation.title,
      slug: translation.slug,
      short_description: translation.short_description || "",
      description: translation.description || "",
      material: translation.material || "",
      image_alt: translation.image_alt || translation.title,
      image_caption: translation.image_caption || "",
      seo_title: translation.seo_title || "",
      seo_description: translation.seo_description || "",
      focus_keyword: translation.focus_keyword || "",
      og_title: translation.og_title || "",
      og_description: translation.og_description || "",
      og_image_url: translation.og_image_url || "",
      robots_index: translation.robots_index !== false,
      robots_follow: translation.robots_follow !== false
    };
    return [{
      ...product,
      ...normalizedTranslation,
      brand: product.brand || "",
      item_condition: product.item_condition || "new",
      can_reserve: Boolean(product.can_reserve && reservationIntegrationAvailable()),
      online_order_enabled: Boolean(product.online_order_enabled),
      woocommerce_url: product.woocommerce_url || "",
      variants: product.variants || [],
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

async function getGalleryProductContext(
  id: string,
  locale: Locale,
  categorySlug?: string | null
): Promise<GalleryProductContext | null> {
  if (!artGalleryCatalogApiUrl) return null;
  const url = new URL(artGalleryCatalogApiUrl);
  url.searchParams.set("locale", locale);
  url.searchParams.set("context_for", id);
  if (categorySlug) url.searchParams.set("category", categorySlug);

  try {
    const response = await integrationFetch(url.toString(), {
      next: { revalidate: 900, tags: ["art-gallery-catalog"] }
    });
    if (!response.ok) return null;
    const context = (await response.json()) as GalleryProductContext;
    return Array.isArray(context.variants) ? context : null;
  } catch (error) {
    console.error("[gallery product context unavailable]", error);
    return null;
  }
}

async function withProductContext(
  product: LocalizedGalleryProduct | null,
  locale: Locale,
  categorySlug?: string | null
) {
  if (!product) return null;
  const context = await getGalleryProductContext(product.id, locale, categorySlug);
  if (!context) return product;
  return {
    ...product,
    variants: context.variants,
    can_reserve: context.can_request && reservationIntegrationAvailable(),
    previous_product: context.previous_product,
    next_product: context.next_product
  } satisfies LocalizedGalleryProduct;
}

export async function getGalleryProductBySlug(
  slug: string,
  locale: Locale,
  categorySlug?: string | null
) {
  const { products } = await getLocalizedGalleryCatalog(locale, { productSlug: slug, pageSize: 1 });
  return withProductContext(
    products.find((product) => product.slug === slug) ?? null,
    locale,
    categorySlug
  );
}

export async function getGalleryProductById(id: string, locale: Locale) {
  const { products } = await getLocalizedGalleryCatalog(locale, { catalogId: id, pageSize: 1 });
  return withProductContext(products.find((product) => product.id === id) ?? null, locale);
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
