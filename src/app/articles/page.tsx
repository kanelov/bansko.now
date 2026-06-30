import type { Metadata } from "next";
import { ArticleCard } from "@/components/public/article-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublishedArticles, getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Всички статии",
  description: "Последни статии, истории и пътеводители от Bansko NOW."
};

export default async function ArticlesPage() {
  const [articles, settings] = await Promise.all([getPublishedArticles({ limit: 48 }), getSiteSettings()]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-moss">Архив</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">Всички статии</h1>
          <p className="mt-5 text-lg leading-8 text-stone-650">
            Последни публикации за събития, култура, природа, местен живот и идеи от Банско.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
