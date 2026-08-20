import type { Metadata, Route } from "next";
import { notFound, redirect } from "next/navigation";
import { GalleryCategoryCard } from "@/components/public/gallery-category-card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { getLocalizedGalleryCategories } from "@/lib/gallery-catalog";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ category?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const canonical = localeUrl(locale, "/art-studio/gallery");
  const title = locale === "en"
    ? "Online gallery and product catalogue | Bansko NOW"
    : "Онлайн галерия и продуктов каталог | Bansko NOW";
  const description = locale === "en"
    ? "Explore the Art Studio collections and reserve selected products for pickup from the gallery in Bansko."
    : "Разгледай колекциите на Art Studio и заяви избрани продукти за взимане от галерията в Банско.";
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

export default async function ArtStudioGalleryPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const [categories, settings] = await Promise.all([
    getLocalizedGalleryCategories(locale),
    getSiteSettings(locale)
  ]);
  const roots = categories.filter((category) => !category.parent_id);

  if (query.category) {
    const legacyCategory = categories.find((category) => category.slug === query.category);
    if (legacyCategory) {
      redirect(localePath(locale, `/art-studio/gallery/category/${legacyCategory.slug}`) as Route);
    }
  }

  const isEnglish = locale === "en";
  const pageUrl = localeUrl(locale, "/art-studio/gallery");
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish ? "Art Studio online gallery" : "Онлайн галерия на Art Studio",
    description: isEnglish
      ? "Collections from the Art Studio catalogue in Bansko."
      : "Колекции от каталога на Art Studio в Банско.",
    url: pageUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: roots.length,
      itemListElement: roots.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.name,
        url: localeUrl(locale, `/art-studio/gallery/category/${category.slug}`)
      }))
    }
  };

  return (
    <div>
      <SiteHeader
        locale={locale}
        alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio/gallery")}
      />
      <main>
        <section className="border-b border-stone-200 bg-stone-100 pt-28">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-moss">Art Studio · Bansko NOW</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-7xl">
              {isEnglish ? "Online gallery" : "Онлайн галерия"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-650">
              {isEnglish
                ? "Explore the same collections shown in the gallery kiosk. Selected products can be requested for pickup in Bansko."
                : "Разгледай същите колекции, които се показват в киоска на галерията. Избраните продукти могат да бъдат заявени за взимане в Банско."}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase text-moss">
              {isEnglish ? "Collections" : "Колекции"}
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-stone-950">
              {isEnglish ? "Choose a category" : "Избери категория"}
            </h2>
          </header>

          {roots.length ? (
            <section
              aria-label={isEnglish ? "Product categories" : "Категории продукти"}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {roots.map((category, index) => (
                <GalleryCategoryCard
                  key={category.id}
                  category={category}
                  locale={locale}
                  priority={index === 0}
                />
              ))}
            </section>
          ) : (
            <section className="border-y border-stone-200 py-16 text-center">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">
                {isEnglish ? "The gallery is being prepared" : "Галерията се подготвя"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-stone-650">
                {isEnglish
                  ? "New collections will appear here after they are published in the gallery catalogue."
                  : "Новите колекции ще се появят тук след публикуване в каталога на галерията."}
              </p>
            </section>
          )}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
    </div>
  );
}
