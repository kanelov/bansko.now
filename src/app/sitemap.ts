import type { MetadataRoute } from "next";
import { getArtStudioProducts, getArtStudioProductTypes } from "@/lib/art-studio";
import { getApprovedBusinesses } from "@/lib/businesses";
import { getArticlePath, getCategories, getPublishedArticles } from "@/lib/content";
import { getGallerySitemapProducts, getLocalizedGalleryCategories } from "@/lib/gallery-catalog";
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
  const [bgCategories, enCategories, bgArticles, enArticles, bgBusinesses, enBusinesses, bgProductTypes, enProductTypes, bgProducts, enProducts, galleryFeed, bgGalleryCategories, enGalleryCategories] = await Promise.all([
    getCategories("bg"),
    getCategories("en"),
    getPublishedArticles({ limit: 500, locale: "bg" }),
    getPublishedArticles({ limit: 500, locale: "en" }),
    getApprovedBusinesses("bg"),
    getApprovedBusinesses("en"),
    getArtStudioProductTypes({ locale: "bg" }),
    getArtStudioProductTypes({ locale: "en" }),
    getArtStudioProducts({ locale: "bg" }),
    getArtStudioProducts({ locale: "en" }),
    getGallerySitemapProducts(),
    getLocalizedGalleryCategories("bg"),
    getLocalizedGalleryCategories("en")
  ]);
  const now = new Date();
  const staticRoutes = ["/", "/articles", "/businesses", "/businesses/map", "/businesses/submit", "/art-studio", "/art-studio/gallery", "/about", "/contact", "/privacy", "/terms"];
  const enCategoryById = new Map(enCategories.map((category) => [category.id, category]));
  const articleByGroup = new Map<string, { bg?: (typeof bgArticles)[number]; en?: (typeof enArticles)[number] }>();
  const enBusinessById = new Map(enBusinesses.map((business) => [business.id, business]));
  const enProductTypeById = new Map(enProductTypes.map((productType) => [productType.id, productType]));
  const enProductById = new Map(enProducts.map((product) => [product.id, product]));
  const enGalleryCategoryById = new Map(enGalleryCategories.map((category) => [category.id, category]));

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
  const artStudioTypeEntries = bgProductTypes.flatMap((productType) => {
    const english = enProductTypeById.get(productType.id);
    const bgPath = `/art-studio/${productType.slug}`;
    const enPath = english ? `/art-studio/${english.slug}` : bgPath;
    const alternates = english ? languageAlternates(bgPath, enPath) : undefined;
    const entries: SitemapEntry[] = [{
      url: localeUrl("bg", bgPath),
      lastModified: new Date(productType.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
      images: productType.image_url ? [productType.image_url] : undefined,
      alternates
    }];
    if (english) entries.push({ ...entries[0], url: localeUrl("en", enPath) });
    return entries;
  });
  const artStudioProductEntries = bgProducts.flatMap((product) => {
    const english = enProductById.get(product.id);
    const bgPath = `/art-studio/${product.product_type.slug}/${product.slug}`;
    const enPath = english ? `/art-studio/${english.product_type.slug}/${english.slug}` : bgPath;
    const alternates = english ? languageAlternates(bgPath, enPath) : undefined;
    const images = [product.image_url, ...(product.gallery_urls || [])].filter((image): image is string => Boolean(image));
    const entries: SitemapEntry[] = [{
      url: localeUrl("bg", bgPath),
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.75,
      images: images.length ? images : undefined,
      alternates
    }];
    if (english) entries.push({ ...entries[0], url: localeUrl("en", enPath) });
    return entries;
  });
  const galleryCategoryEntries = bgGalleryCategories.filter((category) => category.product_count > 0).flatMap((category) => {
    const english = enGalleryCategoryById.get(category.id);
    const bgPath = `/art-studio/gallery/category/${category.slug}`;
    const enPath = english ? `/art-studio/gallery/category/${english.slug}` : bgPath;
    const alternates = english ? languageAlternates(bgPath, enPath) : undefined;
    const entries: SitemapEntry[] = [{
      url: localeUrl("bg", bgPath),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      images: category.image_url ? [category.image_url] : undefined,
      alternates
    }];
    if (english) entries.push({ ...entries[0], url: localeUrl("en", enPath) });
    return entries;
  });
  const galleryProductEntries = galleryFeed.flatMap((product) => {
    const bulgarian = product.translations.find((translation) => translation.locale === "bg" && translation.robots_index);
    const english = product.translations.find((translation) => translation.locale === "en" && translation.robots_index);
    if (!bulgarian && !english) return [];
    const bgPath = bulgarian ? `/art-studio/gallery/${bulgarian.slug}` : "";
    const enPath = english ? `/art-studio/gallery/${english.slug}` : "";
    const alternates = bulgarian && english ? languageAlternates(bgPath, enPath) : undefined;
    return [
      ...(bulgarian ? [{
        url: localeUrl("bg", bgPath),
        lastModified: new Date(product.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.75,
        images: product.image_url ? [product.image_url] : undefined,
        alternates
      }] : []),
      ...(english ? [{
        url: localeUrl("en", enPath),
        lastModified: new Date(product.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.75,
        images: product.image_url ? [product.image_url] : undefined,
        alternates
      }] : [])
    ];
  });

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...businessEntries, ...artStudioTypeEntries, ...artStudioProductEntries, ...galleryCategoryEntries, ...galleryProductEntries];
}
