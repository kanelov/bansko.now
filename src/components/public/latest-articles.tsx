import type { ArticleWithCategory } from "@/lib/types";
import { ArticleCard } from "@/components/public/article-card";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function LatestArticles({ articles, locale = "bg" }: { articles: ArticleWithCategory[]; locale?: Locale }) {
  const dictionary = getDictionary(locale);
  return (
    <section>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">{dictionary.latestArticles}</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">{locale === "en" ? "New from Bansko" : "Ново от Банско"}</h2>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>
    </section>
  );
}
