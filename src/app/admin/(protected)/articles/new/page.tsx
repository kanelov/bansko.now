import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { getCategories, getMediaItems } from "@/lib/content";

type SearchParams = Promise<{ error?: string }>;

export default async function NewArticlePage({ searchParams }: { searchParams: SearchParams }) {
  const [query, categories, mediaItems] = await Promise.all([searchParams, getCategories(), getMediaItems(12)]);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">New Article</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Create article</h1>
      </div>
      {query.error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {query.error}
        </div>
      ) : null}
      <ArticleEditorForm categories={categories} mediaItems={mediaItems} />
    </div>
  );
}
