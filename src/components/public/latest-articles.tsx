import type { ArticleWithCategory } from "@/lib/types";
import { ArticleCard } from "@/components/public/article-card";

export function LatestArticles({ articles }: { articles: ArticleWithCategory[] }) {
  return (
    <section>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Последни статии</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">Ново от Банско</h2>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
