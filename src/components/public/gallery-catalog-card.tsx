import Link from "next/link";
import type { Route } from "next";
import { localePath } from "@/lib/i18n";
import type { LocalizedGalleryProduct } from "@/lib/gallery-catalog";
import type { Locale } from "@/lib/types";

function money(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", {
    style: "currency",
    currency
  }).format(value);
}

function availabilityLabel(product: LocalizedGalleryProduct, locale: Locale) {
  if (product.availability === "out_of_stock") return locale === "en" ? "Out of stock" : "Изчерпан";
  if (product.availability === "preorder") return locale === "en" ? "Pre-order" : "Предварителна заявка";
  if (product.availability === "in_gallery_only") return locale === "en" ? "In the gallery" : "В галерията";
  return locale === "en" ? "Available" : "В наличност";
}

export function GalleryCatalogCard({
  product,
  locale,
  featured = false
}: {
  product: LocalizedGalleryProduct;
  locale: Locale;
  featured?: boolean;
}) {
  const href = localePath(locale, `/art-studio/gallery/${product.slug}`) as Route;
  const image = product.image_urls[0] || "";

  return (
    <article className={`group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-soft ${featured ? "md:grid md:grid-cols-2 lg:col-span-3" : ""}`}>
      <Link href={href} className="block overflow-hidden bg-stone-100">
        {image ? (
          <img
            src={image}
            alt={product.image_alt || product.title}
            width={1200}
            height={900}
            loading={featured ? "eager" : "lazy"}
            fetchPriority={featured ? "high" : "auto"}
            decoding="async"
            className={`w-full object-cover transition duration-300 group-hover:scale-[1.015] ${featured ? "h-full min-h-72" : "aspect-[4/3]"}`}
          />
        ) : (
          <div className="aspect-[4/3] bg-sage" aria-hidden="true" />
        )}
      </Link>
      <div className={`flex flex-col p-5 ${featured ? "justify-center sm:p-8" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase text-moss">
          <span>{product.localized_categories[0]?.name || (locale === "en" ? "Art product" : "Арт продукт")}</span>
          <span>{availabilityLabel(product, locale)}</span>
        </div>
        <h2 className={`mt-3 font-serif font-semibold leading-tight text-stone-950 ${featured ? "text-4xl" : "text-2xl"}`}>
          <Link href={href} className="transition hover:text-forest">{product.title}</Link>
        </h2>
        {product.short_description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-650">{product.short_description}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <strong className="text-lg text-forest">{product.price === null ? (locale === "en" ? "Price in gallery" : "Цена в галерията") : money(product.price, product.currency, locale)}</strong>
          <Link href={href} className="inline-flex rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss hover:text-white">
            {locale === "en" ? "View product" : "Виж продукта"}
          </Link>
        </div>
      </div>
    </article>
  );
}
