import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { GalleryProductNavigation } from "@/components/public/gallery-product-navigation";
import { GalleryReservationForm } from "@/components/public/gallery-reservation-form";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { getGalleryCatalog, getGalleryProductBySlug, getLocalizedGalleryCategories } from "@/lib/gallery-catalog";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; productSlug: string }>;
type SearchParams = Promise<{
  reservation?: string;
  reservation_error?: string;
  from?: string;
}>;

const mostLikedCategoryPattern = /най[-\s]?харес|nay[-\s]?hares|бестсел|best[-\s]?sell|most[-\s]?liked/i;

async function getAlternateProduct(id: string, locale: Locale) {
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const catalog = await getGalleryCatalog({ locale, catalogId: id, pageSize: 1 });
  const product = catalog.products.find((item) => item.id === id);
  const translation = product?.translations.find((item) => item.locale === alternateLocale && item.title && item.slug);
  return translation ? { locale: alternateLocale, translation } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, productSlug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getGalleryProductBySlug(productSlug, locale);
  if (!product) return {};
  const alternate = await getAlternateProduct(product.id, locale);
  const canonical = localeUrl(locale, `/art-studio/gallery/${product.slug}`);
  const languages: Record<string, string> = { [locale]: canonical };
  if (alternate) {
    languages[alternate.locale] = localeUrl(alternate.locale, `/art-studio/gallery/${alternate.translation.slug}`);
    languages["x-default"] = locale === "bg"
      ? canonical
      : localeUrl("bg", `/art-studio/gallery/${alternate.translation.slug}`);
  } else if (locale === "bg") {
    languages["x-default"] = canonical;
  }
  const title = product.seo_title || product.title;
  const description = product.seo_description || product.short_description || undefined;
  const image = product.og_image_url || product.image_urls[0] || undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title: product.og_title || title,
      description: product.og_description || description,
      images: image ? [{ url: image, alt: product.image_alt || product.title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: product.og_title || title,
      description: product.og_description || description,
      images: image ? [image] : undefined
    },
    robots: { index: product.robots_index, follow: product.robots_follow }
  };
}

export default async function GalleryProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ locale, productSlug }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const product = await getGalleryProductBySlug(productSlug, locale, query.from);
  if (!product) notFound();
  const [settings, alternate, categories] = await Promise.all([
    getSiteSettings(locale),
    getAlternateProduct(product.id, locale),
    getLocalizedGalleryCategories(locale)
  ]);
  const isEnglish = locale === "en";
  const fromCategory = product.localized_categories.find((category) => category.slug === query.from)
    ?? product.localized_categories[0]
    ?? null;
  const categoryHref = fromCategory
    ? localePath(locale, `/art-studio/gallery/category/${fromCategory.slug}`)
    : localePath(locale, "/art-studio/gallery");
  const productHref = (slug: string) => {
    const path = localePath(locale, `/art-studio/gallery/${slug}`);
    return `${path}${fromCategory ? `?from=${encodeURIComponent(fromCategory.slug)}` : ""}`;
  };
  const mostLikedCategory = categories.find((category) => (
    category.parent_id === null && mostLikedCategoryPattern.test(`${category.name} ${category.slug}`)
  ));
  const mostLikedHref = mostLikedCategory
    ? localePath(locale, `/art-studio/gallery/category/${mostLikedCategory.slug}`)
    : null;
  const mostLikedCategories = mostLikedCategory
    ? categories
        .filter((category) => category.parent_id === mostLikedCategory.id)
        .map((category) => ({
          href: localePath(locale, `/art-studio/gallery/category/${category.slug}`),
          label: category.name
        }))
    : [];
  const productUrl = localeUrl(locale, `/art-studio/gallery/${product.slug}`);
  const images = product.image_urls.map((src, index) => ({
    src: product.updated_at
      ? `${src}${src.includes("?") ? "&" : "?"}v=${encodeURIComponent(product.updated_at)}`
      : src,
    alt: index === 0
      ? product.image_alt || product.title
      : `${product.image_alt || product.title} ${index + 1}`
  }));
  const onlineUrl = product.online_order_enabled && /^https:\/\//i.test(product.woocommerce_url)
    ? product.woocommerce_url
    : null;
  const offer = onlineUrl && product.price !== null ? {
    "@type": "Offer",
    url: onlineUrl,
    priceCurrency: product.currency,
    price: Number(product.price).toFixed(2),
    availability: product.availability === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : product.availability === "preorder"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition"
  } : undefined;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo_description || product.short_description || product.description || undefined,
    sku: product.sku || undefined,
    image: product.image_urls,
    url: productUrl,
    inLanguage: locale,
    material: product.material || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: offer
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEnglish ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: "Art Studio", item: localeUrl(locale, "/art-studio") },
      { "@type": "ListItem", position: 3, name: isEnglish ? "Gallery" : "Галерия", item: localeUrl(locale, "/art-studio/gallery") },
      ...(fromCategory ? [{
        "@type": "ListItem",
        position: 4,
        name: fromCategory.name,
        item: localeUrl(locale, `/art-studio/gallery/category/${fromCategory.slug}`)
      }] : []),
      {
        "@type": "ListItem",
        position: fromCategory ? 5 : 4,
        name: product.title,
        item: productUrl
      }
    ]
  };
  const alternateHref = alternate
    ? localePath(alternate.locale, `/art-studio/gallery/${alternate.translation.slug}`)
    : null;

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={alternateHref} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={isEnglish ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/art-studio")}>Art Studio</Link><span className="px-2">/</span>
          <Link href={localePath(locale, "/art-studio/gallery")}>{isEnglish ? "Gallery" : "Галерия"}</Link><span className="px-2">/</span>
          {fromCategory ? <><Link href={categoryHref}>{fromCategory.name}</Link><span className="px-2">/</span></> : null}
          <span>{product.title}</span>
        </nav>

        <GalleryProductNavigation
          locale={locale}
          previousHref={product.previous_product ? productHref(product.previous_product.slug) : null}
          previousTitle={product.previous_product?.title}
          nextHref={product.next_product ? productHref(product.next_product.slug) : null}
          nextTitle={product.next_product?.title}
          homeHref={localePath(locale, "/art-studio/gallery")}
          mostLikedHref={mostLikedHref}
          mostLikedCategories={mostLikedCategories}
        />

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-12">
          <article className="min-w-0 lg:col-span-7">
            <p className="text-sm font-semibold uppercase text-moss">{product.localized_categories[0]?.name || (isEnglish ? "Art product" : "Арт продукт")}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{product.title}</h1>
            {product.short_description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-650">{product.short_description}</p> : null}
            {images.length ? <GalleryLightbox images={images} locale={locale} priorityFirst square /> : <div className="mt-10 aspect-square rounded-lg bg-sage" />}
            {product.image_caption ? <p className="mt-3 text-sm leading-6 text-stone-500">{product.image_caption}</p> : null}
            {product.description ? (
              <section className="mt-12 border-t border-stone-200 pt-10">
                <MarkdownRenderer content={product.description} locale={locale} />
              </section>
            ) : null}
          </article>

          <aside className="grid gap-5 lg:sticky lg:top-24 lg:col-span-5">
            <section className="rounded-lg border border-stone-200 bg-stone-100 p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Availability" : "Наличност"}</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-stone-950">
                {product.price === null
                  ? (isEnglish ? "Price in gallery" : "Цена в галерията")
                  : new Intl.NumberFormat(isEnglish ? "en-GB" : "bg-BG", { style: "currency", currency: product.currency }).format(product.price)}
              </p>
              <div className="mt-5 grid gap-3">
                {onlineUrl ? (
                  <a href={onlineUrl} target="_blank" rel="noopener noreferrer sponsored" className="admin-button admin-button-forest w-full px-5 py-3 text-center text-sm font-semibold">
                    {isEnglish ? "Order online" : "Поръчай онлайн"}
                  </a>
                ) : (
                  <button type="button" disabled className="w-full cursor-not-allowed rounded-full border border-stone-300 bg-stone-200 px-5 py-3 text-sm font-semibold text-stone-500">
                    {isEnglish ? "Coming online soon" : "Скоро и онлайн"}
                  </button>
                )}
              </div>
            </section>
            <GalleryReservationForm key={product.id} product={product} locale={locale} reservationCode={query.reservation} reservationError={query.reservation_error} />
          </aside>
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
