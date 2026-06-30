import { notFound } from "next/navigation";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { getAdminArticleById, getCategories, getMediaItems, getTagsForArticle } from "@/lib/content";

type Params = Promise<{ id: string }>;

export default async function EditArticlePage({ params }: { params: Params }) {
  const { id } = await params;
  const [article, categories, tags, mediaItems] = await Promise.all([
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
      <ArticleEditorForm article={{ ...article, tags }} categories={categories} mediaItems={mediaItems} />
    </div>
  );
}
