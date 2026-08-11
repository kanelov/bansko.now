import type { MetadataRoute } from "next";
import { getApprovedBusinesses } from "@/lib/businesses";
import { getArticlePath, getCategories, getPublishedArticles } from "@/lib/content";
import { localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type SitemapEntry = MetadataRoute.Sitemap[number];

function languageAlternates(bgPath: string, enPath: string) {
  return {
    languages: {
      bg: localeUrl("bg", bgPath),
      en: localeUrl("en", enPath),
      "x-default": localeUrl("bg", bgPath)
    }
  };
}

function localizedStaticEntry(locale: Locale, path: string, now: Date): SitemapEntry {
  return {
    url: localeUrl(locale, path),
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
    alternates: languageAlternates(path, path)
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bgCategories, enCategories, bgArticles, enArticles, bgBusinesses, enBusinesses] = await Promise.all([
    getCategories("bg"),
    getCategories("en"),
    getPublishedArticles({ limit: 500, locale: "bg" }),
    getPublishedArticles({ limit: 500, locale: "en" }),
    getApprovedBusinesses("bg"),
    getApprovedBusinesses("en")
  ]);
  const now = new Date();
  const staticRoutes = ["/", "/articles", "/businesses", "/businesses/map", "/businesses/submit", "/art-studio", "/about", "/contact", "/privacy", "/terms"];
  const enCategoryById = new Map(enCategories.map((category) => [category.id, category]));
  const articleByGroup = new Map<string, { bg?: (typeof bgArticles)[number]; en?: (typeof enArticles)[number] }>();
  const enBusinessById = new Map(enBusinesses.map((business) => [business.id, business]));

  for (const article of [...bgArticles, ...enArticles]) {
    const group = articleByGroup.get(article.translation_group_id) ?? {};
    group[article.locale] = article;
    articleByGroup.set(article.translation_group_id, group);
  }

  const staticEntries = staticRoutes.flatMap((path) => [localizedStaticEntry("bg", path, now), localizedStaticEntry("en", path, now)]);
  const categoryEntries = bgCategories.filter((category) => category.slug !== "art-studio").flatMap((category) => {
    const enCategory = enCategoryById.get(category.id);
    const alternates = enCategory ? languageAlternates(`/${category.slug}`, `/${enCategory.slug}`) : undefined;
    const entries: SitemapEntry[] = [{
      url: localeUrl("bg", `/${category.slug}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      alternates
    }];
    if (enCategory) entries.push({ ...entries[0], url: localeUrl("en", `/${enCategory.slug}`) });
    return entries;
  });
  const articleEntries = Array.from(articleByGroup.values()).flatMap((group) => {
    const alternates = group.bg && group.en ? languageAlternates(getArticlePath(group.bg), getArticlePath(group.en)) : undefined;
    return ([group.bg, group.en].filter(Boolean) as (typeof bgArticles)[number][]).map((article) => ({
      url: localeUrl(article.locale, getArticlePath(article)),
      lastModified: new Date(article.updated_at || article.published_at || article.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: article.featured_image_url ? [article.featured_image_url] : undefined,
      alternates
    }));
  });
  const businessEntries = bgBusinesses.flatMap((business) => {
    const english = enBusinessById.get(business.id);
    const bgPath = `/businesses/${business.slug}`;
    const enPath = english ? `/businesses/${english.slug}` : bgPath;
    const alternates = english ? languageAlternates(bgPath, enPath) : undefined;
    const entries: SitemapEntry[] = [{
      url: localeUrl("bg", bgPath),
      lastModified: new Date(business.updated_at || business.created_at),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates
    }];
    if (english) entries.push({ ...entries[0], url: localeUrl("en", enPath) });
    return entries;
  });

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...businessEntries];
}
