import Link from "next/link";
import { getAllAdminArticles } from "@/lib/content";
import { getSeoScore } from "@/lib/seo";

function metricLabel(status: string) {
  if (status === "draft") return "Draft articles";
  if (status === "published") return "Published articles";
  if (status === "scheduled") return "Scheduled articles";
  return status;
}

export default async function AdminDashboardPage() {
  const articles = await getAllAdminArticles();
  const metrics = [
    { label: "Total articles", value: articles.length },
    { label: metricLabel("draft"), value: articles.filter((article) => article.status === "draft").length },
    { label: metricLabel("published"), value: articles.filter((article) => article.status === "published").length },
    { label: metricLabel("scheduled"), value: articles.filter((article) => article.status === "scheduled").length },
    { label: "Articles needing SEO improvements", value: articles.filter((article) => getSeoScore(article) < 80).length }
  ];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Admin</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Dashboard</h1>
        </div>
        <Link href="/admin/articles/new" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950">
          New Article
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-stone-400">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
