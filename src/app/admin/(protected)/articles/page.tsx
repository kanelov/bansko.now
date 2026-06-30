import Link from "next/link";
import type { Route } from "next";
import { publishArticleAction } from "@/app/admin/actions";
import { getAllAdminArticles, getArticleCategory, getArticlePath } from "@/lib/content";
import { getSeoScore } from "@/lib/seo";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export default async function AdminArticlesPage() {
  const articles = await getAllAdminArticles();

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Content</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Articles</h1>
        </div>
        <Link href="/admin/articles/new" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100">
          New Article
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/10 text-stone-300">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">SEO</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {articles.map((article) => {
                const category = getArticleCategory(article);
                return (
                  <tr key={article.id}>
                    <td className="px-4 py-4 font-semibold">{article.title}</td>
                    <td className="px-4 py-4 text-stone-300">{category?.name || "—"}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{article.status}</span>
                    </td>
                    <td className="px-4 py-4 text-stone-300">{formatDate(article.published_at)}</td>
                    <td className="px-4 py-4">{getSeoScore(article)}/100</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/articles/${article.id}/edit` as Route} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100">
                          Edit
                        </Link>
                        {article.status === "published" ? (
                          <Link href={getArticlePath(article) as Route} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold">
                            Preview
                          </Link>
                        ) : null}
                        {article.status !== "published" ? (
                          <form action={publishArticleAction}>
                            <input type="hidden" name="id" value={article.id} />
                            <button className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-stone-950 shadow-sm transition hover:bg-white">
                              Publish
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
