import type { Locale } from "@/lib/types";

/**
 * Lightweight DTOs shared by the server helpers (art-studio-gallery.ts), the API routes and the
 * client picker. They carry only what the compact picker needs; the gallery stays the source of truth.
 */

export type GalleryPickerCategory = { id: string; name: string; slug: string; product_count: number };

export type GalleryPickerConfig = {
  root: GalleryPickerCategory;
  /** Child categories with products, or the root itself when it has no children. */
  categories: GalleryPickerCategory[];
};

export type GalleryDesignCard = { id: string; title: string; slug: string; image_url: string; image_alt: string };

export type GalleryDesignsPage = {
  category_id: string;
  page: number;
  page_count: number;
  total_count: number;
  items: GalleryDesignCard[];
};

export type GalleryDesignVariant = {
  id: string;
  label: string;
  quantity_available: number;
  type_id: string | null;
  type_name: string;
};

export type GalleryDesignDetail = {
  id: string;
  sku: string;
  title: string;
  slug: string;
  image_url: string;
  image_alt: string;
  can_reserve: boolean;
  variants: GalleryDesignVariant[];
};

/** What the order form keeps about the chosen design; the server re-validates by id. */
export type SelectedGalleryDesign = { id: string; title: string; slug: string; image_url: string };

export const galleryDesignsPageSize = 4;

const englishProductTypes: Record<string, string> = {
  "Дамски тениски": "Women's T-shirts",
  "Унисекс тениски": "Unisex T-shirts",
  "Детски тениски": "Kids' T-shirts",
  "Бебешки тениски": "Baby T-shirts",
  "Бебешки бодита": "Baby bodysuits",
  "Принтове": "Prints",
  "Платна": "Canvas prints",
  "Аксесоари": "Accessories"
};

/** Gallery product type names come from the request app in Bulgarian; map the known ones for EN. */
export function localizeGalleryProductType(name: string, locale: Locale) {
  return locale === "en" ? englishProductTypes[name] || name : name;
}
