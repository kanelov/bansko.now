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
type SearchParams = Promise<{ category?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const canonical = localeUrl(locale, "/art-studio/gallery");
  const title = locale === "en" ? "Art Gallery Bansko | Bansko NOW" : "Арт галерия Банско | Bansko NOW";
  const description = locale === "en"
    ? "Original art products inspired by Bansko and Pirin, available to reserve for pickup from our gallery."
    : "Авторски арт продукти, вдъхновени от Банско и Пирин, с възможност за заявка и взимане от галерията.";
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        bg: localeUrl("bg", "/art-studio/gallery"),
        en: localeUrl("en", "/art-studio/gallery"),
        "x-default": localeUrl("bg", "/art-studio/gallery")
      }
    },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function ArtStudioGalleryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const [{ categories, products }, settings] = await Promise.all([
    getLocalizedGalleryCatalog(locale),
    getSiteSettings(locale)
  ]);
  const activeCategory = categories.find((category) => category.slug === query.category) ?? null;
  const filteredProducts = activeCategory
    ? products.filter((product) => product.categories.some((category) => category.id === activeCategory.id))
    : products;
  const featured = !activeCategory ? filteredProducts.find((product) => product.is_featured) ?? null : null;
  const regularProducts = filteredProducts.filter((product) => product.id !== featured?.id);
  const isEnglish = locale === "en";
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish ? "Art Gallery Bansko" : "Арт галерия Банско",
    description: isEnglish
      ? "Original art products inspired by Bansko and Pirin."
      : "Авторски арт продукти, вдъхновени от Банско и Пирин.",
    url: localeUrl(locale, "/art-studio/gallery"),
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
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
              {isEnglish ? "Art Gallery Bansko" : "Арт галерия Банско"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-650">
              {isEnglish
                ? "Original prints, canvases and objects inspired by Bansko and Pirin. Reserve online, collect and pay at the gallery."
                : "Авторски принтове, платна и предмети, вдъхновени от Банско и Пирин. Заяви онлайн, вземи и плати в галерията."}
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

          {filteredProducts.length ? (
            <section aria-label={isEnglish ? "Gallery products" : "Продукти в галерията"} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured ? <GalleryCatalogCard product={featured} locale={locale} featured /> : null}
              {regularProducts.map((product) => <GalleryCatalogCard key={product.id} product={product} locale={locale} />)}
            </section>
          ) : (
            <section className="border-y border-stone-200 py-16 text-center">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">{isEnglish ? "The online gallery is being curated" : "Онлайн галерията се подготвя"}</h2>
              <p className="mx-auto mt-3 max-w-xl text-stone-650">{isEnglish ? "New works will appear here as soon as they are published from the gallery catalog." : "Новите произведения ще се появяват тук веднага след публикуване от каталога на галерията."}</p>
            </section>
          )}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
    </div>
  );
}
