import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryCatalogCard } from "@/components/public/gallery-catalog-card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { getLocalizedGalleryCatalog } from "@/lib/gallery-catalog";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ category?: string; page?: string }>;

function positiveInteger(value: string | undefined) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function galleryQuery(category: string | undefined, page: number) {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (page > 1) query.set("page", String(page));
  const value = query.toString();
  return value ? `?${value}` : "";
}

function paginationItems(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  const page = positiveInteger(query.page);
  const suffix = galleryQuery(query.category, page);
  const canonical = `${localeUrl(locale, "/art-studio/gallery")}${suffix}`;
  const baseTitle = locale === "en" ? "T-shirt catalogue Bansko" : "Каталог тениски Банско";
  const title = `${baseTitle}${page > 1 ? ` · ${locale === "en" ? "Page" : "Страница"} ${page}` : ""} | Bansko NOW`;
  const description = locale === "en"
    ? "Browse the T-shirt designs from the Art Studio kiosk catalogue and reserve available products for gallery pickup in Bansko."
    : "Разгледай моделите тениски от киоск каталога на Art Studio и заяви наличните продукти за взимане от галерията в Банско.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function ArtStudioGalleryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const requestedPage = positiveInteger(query.page);
  const [{ categories, products, page, pageCount, totalCount }, settings] = await Promise.all([
    getLocalizedGalleryCatalog(locale, {
      page: requestedPage,
      pageSize: 24,
      categorySlug: query.category
    }),
    getSiteSettings(locale)
  ]);
  const activeCategory = categories.find((category) => category.slug === query.category) ?? null;
  const featured = !activeCategory && page === 1 ? products.find((product) => product.is_featured) ?? null : null;
  const regularProducts = products.filter((product) => product.id !== featured?.id);
  const isEnglish = locale === "en";
  const pageNumbers = paginationItems(page, pageCount);
  const pageHref = (targetPage: number) => `${localePath(locale, "/art-studio/gallery")}${galleryQuery(query.category, targetPage)}` as Route;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish ? "T-shirt catalogue Bansko" : "Каталог тениски Банско",
    description: isEnglish
      ? "T-shirt designs from the Art Studio kiosk catalogue."
      : "Модели тениски от киоск каталога на Art Studio.",
    url: `${localeUrl(locale, "/art-studio/gallery")}${galleryQuery(query.category, page)}`,
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: (page - 1) * 24 + index + 1,
        name: product.title,
        url: localeUrl(locale, `/art-studio/gallery/${product.slug}`)
      }))
    }
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio/gallery")} />
      <main>
        <section className="border-b border-stone-200 bg-stone-100 pt-28">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-moss">Art Studio · Bansko NOW</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-7xl">
              {isEnglish ? "T-shirt catalogue" : "Каталог тениски"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-650">
              {isEnglish
                ? "Browse the same designs shown in the gallery kiosk. Products currently in stock can be reserved for pickup in Bansko."
                : "Разгледай същите модели, които се показват в киоска на галерията. Наличните продукти могат да бъдат заявени за взимане в Банско."}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {categories.length ? (
            <nav aria-label={isEnglish ? "Product categories" : "Категории продукти"} className="mb-10 flex flex-wrap gap-2 border-b border-stone-200 pb-6">
              <Link href={localePath(locale, "/art-studio/gallery") as Route} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${!activeCategory ? "border-forest bg-forest text-white" : "border-stone-300 bg-white text-forest hover:border-forest hover:bg-forest hover:text-white"}`}>
                {isEnglish ? "All" : "Всички"}
              </Link>
              {categories.map((category) => (
                <Link key={category.id} href={`${localePath(locale, "/art-studio/gallery")}?category=${encodeURIComponent(category.slug)}` as Route} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory?.id === category.id ? "border-forest bg-forest text-white" : "border-stone-300 bg-white text-forest hover:border-forest hover:bg-forest hover:text-white"}`}>
                  {category.name}
                </Link>
              ))}
            </nav>
          ) : null}

          {activeCategory ? (
            <header className="mb-8 max-w-3xl">
              <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Category" : "Категория"}</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-stone-950">{activeCategory.name}</h2>
              {activeCategory.description ? <p className="mt-3 text-base leading-7 text-stone-650">{activeCategory.description}</p> : null}
            </header>
          ) : null}

          {products.length ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
                <p>{isEnglish ? `${totalCount} products from the kiosk catalogue` : `${totalCount} продукта от киоск каталога`}</p>
                <p>{isEnglish ? `Page ${page} of ${pageCount}` : `Страница ${page} от ${pageCount}`}</p>
              </div>
              <section aria-label={isEnglish ? "Gallery products" : "Продукти в галерията"} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured ? <GalleryCatalogCard product={featured} locale={locale} featured priority /> : null}
                {regularProducts.map((product, index) => (
                  <GalleryCatalogCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    priority={!featured && index === 0}
                  />
                ))}
              </section>
              {pageCount > 1 ? (
                <nav className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-stone-200 pt-8" aria-label={isEnglish ? "Catalogue pages" : "Страници на каталога"}>
                  {page > 1 ? <Link href={pageHref(page - 1)} rel="prev" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">{isEnglish ? "Previous" : "Назад"}</Link> : null}
                  {pageNumbers.map((pageNumber, index) => (
                    <span key={pageNumber} className="contents">
                      {index > 0 && pageNumber - pageNumbers[index - 1] > 1 ? <span className="px-1 text-stone-400" aria-hidden="true">…</span> : null}
                      <Link href={pageHref(pageNumber)} aria-current={pageNumber === page ? "page" : undefined} className={`grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-semibold transition ${pageNumber === page ? "border-forest bg-forest text-white" : "border-stone-300 bg-white text-forest hover:border-forest hover:bg-forest hover:text-white"}`}>{pageNumber}</Link>
                    </span>
                  ))}
                  {page < pageCount ? <Link href={pageHref(page + 1)} rel="next" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">{isEnglish ? "Next" : "Напред"}</Link> : null}
                </nav>
              ) : null}
            </>
          ) : (
            <section className="border-y border-stone-200 py-16 text-center">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">{isEnglish ? "No products found" : "Няма намерени продукти"}</h2>
              <p className="mx-auto mt-3 max-w-xl text-stone-650">{isEnglish ? "Try another category or return to the full catalogue." : "Избери друга категория или се върни към целия каталог."}</p>
            </section>
          )}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
    </div>
  );
}
