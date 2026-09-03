import "server-only";

import { getGalleryProductById, getLocalizedGalleryCatalog, getLocalizedGalleryCategories, type LocalizedGalleryCategory } from "@/lib/gallery-catalog";
import {
  galleryDesignsPageSize,
  type GalleryDesignDetail,
  type GalleryDesignsPage,
  type GalleryPickerConfig
} from "@/lib/art-studio-gallery-types";
import type { ArtStudioProductType, Locale } from "@/lib/types";

/**
 * Server-side bridge between an Art Studio product type and the synced gallery catalog.
 * The mapping is the gallery category's stable id stored on the product type. All data comes
 * from the existing gallery integration (cached 15 min); only the selected design's variant
 * context is fetched fresher (60 s).
 */

function toPickerCategory(category: LocalizedGalleryCategory) {
  return { id: category.id, name: category.name, slug: category.slug, product_count: category.product_count };
}

export async function getGalleryPickerConfig(
  productType: Pick<ArtStudioProductType, "gallery_picker_enabled" | "gallery_category_id">,
  locale: Locale
): Promise<GalleryPickerConfig | null> {
  if (!productType.gallery_picker_enabled || !productType.gallery_category_id) return null;
  const categories = await getLocalizedGalleryCategories(locale);
  const root = categories.find((category) => category.id === productType.gallery_category_id);
  if (!root) return null;
  const children = categories
    .filter((category) => category.parent_id === root.id && category.product_count > 0)
    .map(toPickerCategory);
  const list = children.length ? children : root.product_count > 0 ? [toPickerCategory(root)] : [];
  return list.length ? { root: toPickerCategory(root), categories: list } : null;
}

/** One page of four designs from a gallery category (validated against the gallery category tree). */
export async function getGalleryDesignsPage(locale: Locale, categoryId: string, page: number): Promise<GalleryDesignsPage | null> {
  const categories = await getLocalizedGalleryCategories(locale);
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;
  const catalog = await getLocalizedGalleryCatalog(locale, {
    categorySlug: category.slug,
    page: Math.max(1, page),
    pageSize: galleryDesignsPageSize
  });
  return {
    category_id: category.id,
    page: catalog.page,
    page_count: catalog.pageCount,
    total_count: catalog.totalCount,
    items: catalog.products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      image_url: product.image_urls[0] || "",
      image_alt: product.image_alt || product.title
    }))
  };
}

/** Selected design with its current gallery variants and stock (fresh within 60 s). */
export async function getGalleryDesignDetail(id: string, locale: Locale): Promise<GalleryDesignDetail | null> {
  const product = await getGalleryProductById(id, locale, { revalidate: 60 });
  if (!product) return null;
  return {
    id: product.id,
    sku: product.sku,
    title: product.title,
    slug: product.slug,
    image_url: product.image_urls[0] || "",
    image_alt: product.image_alt || product.title,
    can_reserve: product.can_reserve,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      quantity_available: Math.max(0, Number(variant.quantity_available) || 0),
      type_id: variant.product_type?.id ?? null,
      type_name: variant.product_type?.name ?? ""
    }))
  };
}

export type ArtStudioGalleryPicker = { config: GalleryPickerConfig; firstPage: GalleryDesignsPage | null };

/** Everything the type page needs to render the picker without a client round trip. */
export async function getArtStudioGalleryPicker(
  productType: Pick<ArtStudioProductType, "gallery_picker_enabled" | "gallery_category_id">,
  locale: Locale
): Promise<ArtStudioGalleryPicker | null> {
  try {
    const config = await getGalleryPickerConfig(productType, locale);
    if (!config) return null;
    const firstPage = await getGalleryDesignsPage(locale, config.categories[0].id, 1);
    return { config, firstPage };
  } catch (error) {
    console.error("[art studio gallery picker unavailable]", error);
    return null;
  }
}
