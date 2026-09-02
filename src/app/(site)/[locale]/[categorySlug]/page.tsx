import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArtStudioNativeBlock } from "@/components/public/art-studio-native-block";
import { ArticleCard } from "@/components/public/article-card";
import { CategoryCard } from "@/components/public/category-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { FeaturedArticle } from "@/components/public/featured-article";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { siteUrl } from "@/lib/env";
import {
  getArticlePath,
  getCategories,
  getCategoryBySlug,
  getPublishedArticleCounts,
  getPublishedArticles,
  getSiteSettings
} from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string; categorySlug: string }>;

// Category pages are cached and refreshed every 15 minutes; publishing revalidates them immediately.
// Known categories are generated at build time; new ones render on demand and are then cached.
export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return [];
  const categories = await getCategories(params.locale);
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  if (!isLocale(locale)) return {};
  const [category, counts] = await Promise.all([getCategoryBySlug(categorySlug, locale), getPublishedArticleCounts(locale)]);

  if (!category) {
    return {};
  }

  const hasArticles = (counts.get(category.id) ?? 0) > 0;

  return {
    title: {
      absolute: category.seo_title || `${category.name} | Bansko NOW`
    },
    description: category.seo_description || category.description || undefined,
    alternates: {
      canonical: category.canonical_url || localeUrl(locale, `/${category.slug}`),
      languages: {
        bg: localeUrl("bg", `/${category.slug}`),
        en: localeUrl("en", `/${category.slug}`),
        "x-default": localeUrl("bg", `/${category.slug}`)
      }
    },
    openGraph: {
      title: category.og_title || category.seo_title || category.name,
      description: category.og_description || category.seo_description || category.description || undefined,
      images: category.og_image_url ? [category.og_image_url] : undefined,
      type: "website",
      url: localeUrl(locale, `/${category.slug}`)
    },
    robots: {
      // An empty category is public but kept out of the index until it has content.
      index: (category.robots_index ?? true) && hasArticles,
      follow: category.robots_follow ?? true
    }
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, categorySlug } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [category, settings, categories, articles] = await Promise.all([
    getCategoryBySlug(categorySlug, locale),
    getSiteSettings(locale),
    getCategories(locale),
    getPublishedArticles({ categorySlug, limit: 24, locale })
  ]);

  if (!category) {
    notFound();
  }

  const [featured, ...rest] = articles;
  const otherCategories = categories.filter((item) => item.slug !== category.slug).slice(0, 3);
  const categoryUrl = localeUrl(locale, `/${category.slug}`);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": category.schema_type || "CollectionPage",
    name: category.name,
    description: category.description,
    url: categoryUrl,
    inLanguage: locale === "en" ? "en" : "bg",
    isPartOf: { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: localeUrl(locale) },
    ...(articles.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: articles.length,
            itemListElement: articles.map((article, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${siteUrl}${getArticlePath(article)}`,
              name: article.title
            }))
          }
        }
      : {})
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dictionary.home, item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: dictionary.articlesMenu, item: localeUrl(locale, "/articles") },
      { "@type": "ListItem", position: 3, name: category.name, item: categoryUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", `/${category.slug}`)} />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:px-8">
        <header className="max-w-4xl">
          <nav className="text-sm text-stone-500" aria-label={dictionary.navigation}>
            <Link href={localePath(locale, "/") as Route}>{dictionary.home}</Link>
            <span className="px-2">/</span>
            <Link href={localePath(locale, "/articles") as Route}>{dictionary.articlesMenu}</Link>
            <span className="px-2">/</span>
            <span className="text-stone-700">{category.name}</span>
          </nav>
          <p className="mt-6 text-sm font-semibold uppercase text-moss">Bansko NOW</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{category.name}</h1>
          {category.description ? (
            <p className="mt-5 text-lg leading-8 text-stone-650">{category.description}</p>
          ) : null}
        </header>

        {featured ? <FeaturedArticle article={featured} locale={locale} /> : null}

        {rest.length ? (
          <section>
            <h2 className="font-serif text-3xl font-semibold text-stone-950">{dictionary.latestArticles}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}

        {!articles.length ? (
          <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-lg text-stone-650">
              {locale === "en" ? "The first articles in this category are on their way." : "Първите статии в тази категория са на път."}
            </p>
            <Link href={localePath(locale, "/articles") as Route} className="mt-5 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
              {dictionary.allArticles}
            </Link>
          </section>
        ) : null}

        {otherCategories.length ? (
          <section>
            <h2 className="font-serif text-3xl font-semibold text-stone-950">{locale === "en" ? "More categories" : "Още категории"}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {otherCategories.map((item) => (
                <CategoryCard key={item.slug} category={item} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}

        <ArtStudioNativeBlock locale={locale} settings={settings} />
        <FacebookGroupCTA settings={settings} locale={locale} />
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
