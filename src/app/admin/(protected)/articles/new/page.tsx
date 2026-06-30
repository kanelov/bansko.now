import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { getCategories, getMediaItems } from "@/lib/content";

export default async function NewArticlePage() {
  const [categories, mediaItems] = await Promise.all([getCategories(), getMediaItems(12)]);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">New Article</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Create article</h1>
      </div>
      <ArticleEditorForm categories={categories} mediaItems={mediaItems} />
    </div>
  );
}
