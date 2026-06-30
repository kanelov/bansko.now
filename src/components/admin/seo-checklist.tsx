import { getSeoChecklist, getSeoScore } from "@/lib/seo";
import type { ArticleWithCategory } from "@/lib/types";

export function SEOChecklist({ article }: { article: Partial<ArticleWithCategory> }) {
  const items = getSeoChecklist(article);
  const score = getSeoScore(article);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-950">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-2xl font-semibold">SEO checklist</h3>
        <span className="rounded-full bg-sage px-3 py-1 text-sm font-semibold text-forest">{score}/100</span>
      </div>
      <div className="mt-5 grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${item.passed ? "bg-moss" : "bg-clay"}`}
              aria-hidden="true"
            />
            <span className={item.passed ? "text-stone-700" : "text-stone-500"}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
