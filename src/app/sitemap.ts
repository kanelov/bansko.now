import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles, getArticlePath } from "@/lib/content";
import { categoryDefinitions } from "@/lib/defaults";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, articles] = await Promise.all([getCategories(), getPublishedArticles({ limit: 200 })]);
  const now = new Date();
  const staticRoutes = ["", "/articles", "/about", "/contact", "/privacy", "/terms"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.6
    })),
    ...(categories.length ? categories : categoryDefinitions).map((category) => ({
      url: `${siteUrl}/${category.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8
    })),
    ...articles.map((article) => ({
      url: `${siteUrl}${getArticlePath(article)}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
