import { notFound } from "next/navigation";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { getAdminArticleById, getCategories, getMediaItems, getTagsForArticle } from "@/lib/content";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string; published?: string; error?: string }>;

export default async function EditArticlePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const [query, article, categories, tags, mediaItems] = await Promise.all([
    searchParams,
    getAdminArticleById(id),
    getCategories(),
    getTagsForArticle(id),
    getMediaItems(12)
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Edit Article</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">{article.title}</h1>
      </div>
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
      <ArticleEditorForm key={id} article={{ ...article, tags }} categories={categories} mediaItems={mediaItems} />
    </div>
  );
}
