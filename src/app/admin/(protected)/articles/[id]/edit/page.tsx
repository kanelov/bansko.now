import { notFound } from "next/navigation";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import Link from "next/link";
import type { Route } from "next";
import { getAdminArticleById, getAdminArticleTranslations, getCategories, getMediaItems, getSiteSettings, getTagsForArticle } from "@/lib/content";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string; published?: string; error?: string }>;

export default async function EditArticlePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const [query, article] = await Promise.all([searchParams, getAdminArticleById(id)]);

  if (!article) {
    notFound();
  }

  const [categories, tags, mediaItems, translations, settings] = await Promise.all([
    getCategories(article.locale),
    getTagsForArticle(id),
    getMediaItems(12),
    getAdminArticleTranslations(article.translation_group_id),
    getSiteSettings(article.locale)
  ]);
  const bgArticle = translations.find((item) => item.locale === "bg");
  const enArticle = translations.find((item) => item.locale === "en");

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Edit Article</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">{article.title}</h1>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Версии на статията">
        {bgArticle ? (
          <Link href={`/admin/articles/${bgArticle.id}/edit` as Route} className={`admin-button px-4 py-2 text-sm font-semibold ${article.locale === "bg" ? "admin-button-primary" : "admin-button-secondary"}`}>
            Български
          </Link>
        ) : (
          <Link href={`/admin/articles/new?locale=bg&translation_group_id=${article.translation_group_id}` as Route} className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold">
            + Български
          </Link>
        )}
        {enArticle ? (
          <Link href={`/admin/articles/${enArticle.id}/edit` as Route} className={`admin-button px-4 py-2 text-sm font-semibold ${article.locale === "en" ? "admin-button-primary" : "admin-button-secondary"}`}>
            English
          </Link>
        ) : (
          <Link href={`/admin/articles/new?locale=en&translation_group_id=${article.translation_group_id}` as Route} className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold">
            + English
          </Link>
        )}
      </nav>
      {query.saved ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Промените са запазени.
        </div>
      ) : null}
      {query.published ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Статията е публикувана успешно.
        </div>
      ) : null}
      {query.error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {query.error}
        </div>
      ) : null}
      <ArticleEditorForm key={id} article={{ ...article, tags }} categories={categories} mediaItems={mediaItems} locale={article.locale} translationGroupId={article.translation_group_id} settings={settings} />
    </div>
  );
}
