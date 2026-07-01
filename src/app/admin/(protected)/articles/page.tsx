import Link from "next/link";
import type { Route } from "next";
import { deleteArticleAction, publishArticleAction } from "@/app/admin/actions";
import { getAllAdminArticles, getArticleCategory, getArticlePath } from "@/lib/content";
import { getSeoScore } from "@/lib/seo";

type SearchParams = Promise<{ deleted?: string; error?: string }>;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export default async function AdminArticlesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, articles] = await Promise.all([searchParams, getAllAdminArticles()]);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Content</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Articles</h1>
        </div>
        <Link href="/admin/articles/new" className="admin-button admin-button-primary px-5 py-3 text-sm font-semibold">
          New Article
        </Link>
      </div>

      {params.deleted ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Статията е изтрита.
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {params.error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
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
                        <Link href={`/admin/articles/${article.id}/edit` as Route} className="admin-button admin-button-primary px-3 py-1.5 text-xs font-semibold">
                          Edit
                        </Link>
                        {article.status === "published" ? (
                          <Link href={getArticlePath(article) as Route} className="admin-button admin-button-secondary px-3 py-1.5 text-xs font-semibold">
                            Preview
                          </Link>
                        ) : null}
                        {article.status !== "published" ? (
                          <form action={publishArticleAction}>
                            <input type="hidden" name="id" value={article.id} />
                            <button className="admin-button admin-button-sage px-3 py-1.5 text-xs font-semibold">
                              Publish
                            </button>
                          </form>
                        ) : null}
                        <details>
                          <summary className="admin-button admin-button-danger list-none px-3 py-1.5 text-xs font-semibold">
                            Delete
                          </summary>
                          <form action={deleteArticleAction} className="mt-2 grid min-w-44 gap-2 rounded-xl border border-red-300/20 bg-red-950/30 p-3">
                            <input type="hidden" name="id" value={article.id} />
                            <p className="text-xs leading-5 text-red-100">Потвърди изтриването.</p>
                            <button className="admin-button admin-button-danger px-3 py-1.5 text-xs font-semibold">
                              Confirm delete
                            </button>
                          </form>
                        </details>
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
