import Link from "next/link";
import { fallbackHeroImage, getArticleCategory, getArticlePath } from "@/lib/content";
import type { Route } from "next";
import type { ArticleWithCategory } from "@/lib/types";

export function FeaturedArticle({ article }: { article: ArticleWithCategory | null }) {
  if (!article) {
    return null;
  }

  const category = getArticleCategory(article);
  const image = article.featured_image_url || fallbackHeroImage;
  const articlePath = getArticlePath(article) as Route;

  return (
    <section className="grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-soft lg:grid-cols-[1.08fr_0.92fr]">
      <Link href={articlePath} className="min-h-96 overflow-hidden bg-stone-200">
        <img src={image} alt={article.featured_image_alt || article.title} className="h-full w-full object-cover" />
      </Link>
      <div className="flex flex-col justify-center p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase text-moss">Препоръчано</p>
        {category ? <p className="mt-4 text-sm text-stone-500">{category.name}</p> : null}
        <Link href={articlePath}>
          <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-stone-950">{article.title}</h2>
        </Link>
        {article.excerpt ? <p className="mt-5 text-lg leading-8 text-stone-650">{article.excerpt}</p> : null}
        <Link
          href={articlePath}
          className="mt-8 inline-flex w-fit rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss"
        >
          Прочети статията
        </Link>
      </div>
    </section>
  );
}
