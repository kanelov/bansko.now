import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/public/article-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { siteUrl } from "@/lib/env";
import { getArticlePath, getCategories, getPublishedArticleCounts, getPublishedArticles, getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = locale === "en" ? "Articles about Bansko: news, nature, culture and local life" : "Статии за Банско: новини, природа, култура и местен живот";
  const description = locale === "en"
    ? "All Bansko NOW articles in one place: daily news from Bansko, guides to Pirin, events, culture, food and stories from local life. Updated every day."
    : "Всички статии на Bansko NOW на едно място: ежедневни новини от Банско, пътеводители за Пирин, събития, култура, храна и истории от местния живот.";
  return {
    title: { absolute: `${title} | Bansko NOW` },
    description,
    alternates: {
      canonical: localeUrl(locale, "/articles"),
      languages: { bg: localeUrl("bg", "/articles"), en: localeUrl("en", "/articles"), "x-default": localeUrl("bg", "/articles") }
    },
    openGraph: { title, description, type: "website", url: localeUrl(locale, "/articles") }
  };
}

export default async function ArticlesPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [articles, settings, categories, counts] = await Promise.all([
    getPublishedArticles({ limit: 48, locale }),
    getSiteSettings(locale),
    getCategories(locale),
    getPublishedArticleCounts(locale)
  ]);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: dictionary.allArticles,
    url: localeUrl(locale, "/articles"),
    inLanguage: locale === "en" ? "en" : "bg",
    isPartOf: { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: localeUrl(locale) },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 24).map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${getArticlePath(article)}`,
        name: article.title
      }))
    }
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/articles")} />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-moss">{dictionary.articlesMenu}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{dictionary.allArticles}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-650">
            {locale === "en"
              ? "Daily news from Bansko, guides to Pirin, events, culture, food and stories from local life. The newest articles come first."
              : "Ежедневни новини от Банско, пътеводители за Пирин, събития, култура, храна и истории от местния живот. Най-новите статии са първи."}
          </p>
          {categories.length ? (
            <nav className="mt-6 flex flex-wrap gap-2" aria-label={dictionary.categoriesLabel}>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={localePath(locale, `/${category.slug}`) as Route}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-forest hover:bg-forest hover:text-white"
                >
                  {category.name}
                  {counts.get(category.id) ? <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-forest">{counts.get(category.id)}</span> : null}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>
        {articles.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} locale={locale} priority={index < 3} />
            ))}
          </div>
        ) : (
          <p className="text-lg text-stone-650">{locale === "en" ? "No articles yet." : "Още няма публикувани статии."}</p>
        )}
        <FacebookGroupCTA settings={settings} locale={locale} />
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
