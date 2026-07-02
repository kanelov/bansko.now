import type { MetadataRoute } from "next";
import { getBusinessPath } from "@/lib/business-public";
import { getApprovedBusinesses } from "@/lib/businesses";
import { getCategories, getPublishedArticles, getArticlePath } from "@/lib/content";
import { categoryDefinitions } from "@/lib/defaults";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, articles, businesses] = await Promise.all([
    getCategories(),
    getPublishedArticles({ limit: 200 }),
    getApprovedBusinesses()
  ]);
  const now = new Date();
  const staticRoutes = ["", "/articles", "/businesses", "/businesses/map", "/businesses/submit", "/about", "/contact", "/privacy", "/terms"];

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
    })),
    ...businesses.map((business) => ({
      url: `${siteUrl}${getBusinessPath(business)}`,
      lastModified: business.updated_at ? new Date(business.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
