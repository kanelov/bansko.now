import type { Metadata } from "next";
import { ArticleCard } from "@/components/public/article-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublishedArticles, getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const description = locale === "en" ? "Latest articles, stories and guides from Bansko NOW." : "Последни статии, истории и пътеводители от Bansko NOW.";
  return {
    title: dictionary.allArticles,
    description,
    alternates: {
      canonical: localeUrl(locale, "/articles"),
      languages: { bg: localeUrl("bg", "/articles"), en: localeUrl("en", "/articles"), "x-default": localeUrl("bg", "/articles") }
    }
  };
}

export default async function ArticlesPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [articles, settings] = await Promise.all([getPublishedArticles({ limit: 48, locale }), getSiteSettings(locale)]);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/articles")} />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "Archive" : "Архив"}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{dictionary.allArticles}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-650">
            {locale === "en" ? "The latest stories about events, culture, nature, local life and ideas from Bansko." : "Последни публикации за събития, култура, природа, местен живот и идеи от Банско."}
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
        <FacebookGroupCTA settings={settings} locale={locale} />
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
