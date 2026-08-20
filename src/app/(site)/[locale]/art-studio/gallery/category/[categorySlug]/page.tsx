import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryCatalogCard } from "@/components/public/gallery-catalog-card";
import { GalleryCategoryCard } from "@/components/public/gallery-category-card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import {
  getLocalizedGalleryCatalog,
  getLocalizedGalleryCategories,
  type LocalizedGalleryCategory
} from "@/lib/gallery-catalog";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; categorySlug: string }>;
type SearchParams = Promise<{ page?: string }>;

function positiveInteger(value: string | undefined) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function categoryPath(locale: Locale, slug: string, page = 1) {
  const path = localePath(locale, `/art-studio/gallery/category/${slug}`);
  return `${path}${page > 1 ? `?page=${page}` : ""}` as Route;
}

function categoryUrl(locale: Locale, slug: string, page = 1) {
  const url = localeUrl(locale, `/art-studio/gallery/category/${slug}`);
  return `${url}${page > 1 ? `?page=${page}` : ""}`;
}

function paginationItems(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

function categoryTrail(
  category: LocalizedGalleryCategory,
  categories: LocalizedGalleryCategory[]
) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const trail: LocalizedGalleryCategory[] = [];
  let current: LocalizedGalleryCategory | undefined = category;
  while (current) {
    trail.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return trail;
}

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [{ locale, categorySlug }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  const categories = await getLocalizedGalleryCategories(locale);
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) return {};
  const page = positiveInteger(query.page);
  const canonical = categoryUrl(locale, category.slug, page);
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const alternate = category.translations.find(
    (translation) => translation.locale === alternateLocale && translation.name && translation.slug
  );
  const titleBase = category.seo_title || category.name;
  const title = page > 1
    ? `${titleBase} · ${locale === "en" ? "Page" : "Страница"} ${page}`
    : titleBase;
  const description = category.seo_description || category.description || undefined;
  const languages: Record<string, string> = { [locale]: canonical };
  if (alternate) {
    languages[alternateLocale] = categoryUrl(alternateLocale, alternate.slug, page);
  }
  if (locale === "bg") languages["x-default"] = canonical;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: category.image_url
        ? [{ url: category.image_url, alt: category.image_alt || category.name }]
        : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: category.image_url ? [category.image_url] : undefined
    },
    robots: { index: category.product_count > 0, follow: true }
  };
}

export default async function GalleryCategoryPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ locale, categorySlug }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const categories = await getLocalizedGalleryCategories(locale);
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) notFound();

  const requestedPage = positiveInteger(query.page);
  const children = categories.filter((item) => item.parent_id === category.id);
  const shouldLoadProducts = children.length === 0 || category.direct_product_count > 0;
  const [catalog, settings] = await Promise.all([
    shouldLoadProducts
      ? getLocalizedGalleryCatalog(locale, {
          page: requestedPage,
          pageSize: 24,
          categorySlug: category.slug,
          directOnly: children.length > 0
        })
      : Promise.resolve({
          generatedAt: "",
          page: 1,
          pageSize: 24,
          totalCount: 0,
          pageCount: 0,
          categories,
          products: []
        }),
    getSiteSettings(locale)
  ]);
  const { products, page, pageCount, totalCount } = catalog;
  const trail = categoryTrail(category, categories);
  const isEnglish = locale === "en";
  const pageNumbers = paginationItems(page, pageCount);
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const alternate = category.translations.find(
    (translation) => translation.locale === alternateLocale && translation.name && translation.slug
  );
  const alternateHref = alternate
    ? categoryPath(alternateLocale, alternate.slug, page)
    : null;
  const currentUrl = categoryUrl(locale, category.slug, page);
  const listItems = [
    ...children.map((item) => ({
      name: item.name,
      url: localeUrl(locale, `/art-studio/gallery/category/${item.slug}`)
    })),
    ...products.map((product) => ({
      name: product.title,
      url: localeUrl(locale, `/art-studio/gallery/${product.slug}`)
    }))
  ];
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.seo_description || category.description || undefined,
    url: currentUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.product_count,
      itemListElement: listItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url
      }))
    }
  };
  const breadcrumbItems = [
    { name: isEnglish ? "Home" : "Начало", url: localeUrl(locale) },
    { name: isEnglish ? "Gallery" : "Галерия", url: localeUrl(locale, "/art-studio/gallery") },
    ...trail.map((item) => ({
      name: item.name,
      url: localeUrl(locale, `/art-studio/gallery/category/${item.slug}`)
    }))
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={alternateHref} />
      <main>
        <section className="border-b border-stone-200 bg-stone-100 pt-28">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-stone-500" aria-label={isEnglish ? "Breadcrumb" : "Навигация"}>
              <Link href={localePath(locale, "/art-studio/gallery")}>{isEnglish ? "Gallery" : "Галерия"}</Link>
              {trail.map((item) => (
                <span key={item.id} className="contents">
                  <span aria-hidden="true">/</span>
                  <Link href={categoryPath(locale, item.slug)} aria-current={item.id === category.id ? "page" : undefined}>{item.name}</Link>
                </span>
              ))}
            </nav>
            <p className="mt-8 text-sm font-semibold uppercase text-moss">Art Studio · Bansko NOW</p>
            <h1 className="mt-3 max-w-4xl font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">{category.description}</p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {children.length ? (
            <section className="mb-14">
              <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-950">
                {isEnglish ? "Subcategories" : "Подкатегории"}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {children.map((child, index) => (
                  <GalleryCategoryCard
                    key={child.id}
                    category={child}
                    locale={locale}
                    priority={index === 0}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {products.length ? (
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
                <h2 className="font-serif text-3xl font-semibold text-stone-950">
                  {isEnglish ? "Products" : "Продукти"}
                </h2>
                <p>{isEnglish ? `${totalCount} products` : `${totalCount} продукта`}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <GalleryCatalogCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    categorySlug={category.slug}
                    priority={index === 0}
                  />
                ))}
              </div>
              {pageCount > 1 ? (
                <nav className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-stone-200 pt-8" aria-label={isEnglish ? "Catalogue pages" : "Страници на каталога"}>
                  {page > 1 ? (
                    <Link href={categoryPath(locale, category.slug, page - 1)} rel="prev" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
                      {isEnglish ? "Previous" : "Назад"}
                    </Link>
                  ) : null}
                  {pageNumbers.map((pageNumber, index) => (
                    <span key={pageNumber} className="contents">
                      {index > 0 && pageNumber - pageNumbers[index - 1] > 1 ? <span className="px-1 text-stone-400" aria-hidden="true">…</span> : null}
                      <Link href={categoryPath(locale, category.slug, pageNumber)} aria-current={pageNumber === page ? "page" : undefined} className={`grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-semibold transition ${pageNumber === page ? "border-forest bg-forest text-white" : "border-stone-300 bg-white text-forest hover:border-forest hover:bg-forest hover:text-white"}`}>
                        {pageNumber}
                      </Link>
                    </span>
                  ))}
                  {page < pageCount ? (
                    <Link href={categoryPath(locale, category.slug, page + 1)} rel="next" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
                      {isEnglish ? "Next" : "Напред"}
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </section>
          ) : children.length ? null : (
            <section className="border-y border-stone-200 py-16 text-center">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                {isEnglish ? "No products found" : "Няма намерени продукти"}
              </h2>
            </section>
          )}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
