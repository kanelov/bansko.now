import Link from "next/link";
import { ResponsiveImage } from "@/components/public/responsive-image";
import { fallbackHeroImage, getArticleCategory, getArticlePath } from "@/lib/content";
import type { Route } from "next";
import type { ArticleWithCategory } from "@/lib/types";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function ArticleCard({ article, priority = false, locale = article.locale }: { article: ArticleWithCategory; priority?: boolean; locale?: Locale }) {
  const category = getArticleCategory(article);
  const image = article.featured_image_url || fallbackHeroImage;
  const articlePath = getArticlePath(article) as Route;

  return (
    <article className="group grid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl">
      <Link href={articlePath} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-stone-200">
          <ResponsiveImage
            src={image}
            alt={article.featured_image_alt || article.title}
            width={800}
            height={600}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        </div>
      </Link>
      <div className="grid gap-3 p-5">
        {category ? (
          <Link href={localePath(locale, `/${category.slug}`) as Route} className="text-xs font-semibold uppercase text-moss">
            {category.name}
          </Link>
        ) : null}
        <Link href={articlePath}>
          <h3 className="font-serif text-2xl font-semibold leading-tight text-stone-950">
            {article.title}
          </h3>
        </Link>
        {article.excerpt ? <p className="line-clamp-3 text-sm leading-6 text-stone-600">{article.excerpt}</p> : null}
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>{article.author_name || "Любо Канелов"}</span>
          <span>{article.reading_time || 1} {locale === "en" ? "min" : "мин."}</span>
        </div>
      </div>
    </article>
  );
}
