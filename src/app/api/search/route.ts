import { NextResponse } from "next/server";
import { getApprovedBusinesses } from "@/lib/businesses";
import { getBusinessPath } from "@/lib/business-public";
import { getArticlePath, getCategories, getEditablePages, getPublishedArticles } from "@/lib/content";
import { getLocalizedGalleryCatalog } from "@/lib/gallery-catalog";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function includesQuery(values: Array<string | null | undefined>, query: string) {
  return values.some((value) => value?.toLocaleLowerCase().includes(query));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLocale = searchParams.get("locale") || "bg";
  const locale = isLocale(rawLocale) ? rawLocale : "bg";
  const query = (searchParams.get("q") || "").trim().toLocaleLowerCase();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [articles, businesses, categories, pages, gallery] = await Promise.all([
    getPublishedArticles({ limit: 100, locale }),
    getApprovedBusinesses(locale),
    getCategories(locale),
    getEditablePages({ locale }),
    getLocalizedGalleryCatalog(locale, { query, pageSize: 5 })
  ]);
  const labels = locale === "en"
    ? { article: "Article", business: "Business", category: "Category", page: "Page", product: "Gallery product" }
    : { article: "Статия", business: "Бизнес", category: "Категория", page: "Страница", product: "Продукт от галерията" };

  const articleResults = articles
    .filter((article) => includesQuery([article.title, article.excerpt, article.content], query))
    .slice(0, 5)
    .map((article) => ({
      id: `article-${article.id}`,
      type: labels.article,
      title: article.title,
      description: article.excerpt,
      href: getArticlePath(article)
    }));
  const businessResults = businesses
    .filter((business) => includesQuery([business.name, business.category, business.address, business.description], query))
    .slice(0, 5)
    .map((business) => ({
      id: `business-${business.id}`,
      type: labels.business,
      title: business.name,
      description: `${business.category} · ${business.address}`,
      href: getBusinessPath(business, locale)
    }));
  const categoryResults = categories
    .filter((category) => includesQuery([category.name, category.description], query))
    .slice(0, 4)
    .map((category) => ({
      id: `category-${category.id}`,
      type: labels.category,
      title: category.name,
      description: category.description,
      href: localePath(locale, `/${category.slug}`)
    }));
  const pageResults = pages
    .filter((page) => includesQuery([page.title, page.excerpt, page.content], query))
    .slice(0, 3)
    .map((page) => ({
      id: `page-${page.id}`,
      type: labels.page,
      title: page.title,
      description: page.excerpt,
      href: localePath(locale, `/${page.slug}`)
    }));
  const galleryResults = gallery.products
    .filter((product) => includesQuery([
      product.title,
      product.short_description,
      product.description,
      product.sku,
      product.material,
      ...product.localized_categories.map((category) => category.name)
    ], query))
    .slice(0, 5)
    .map((product) => ({
      id: `gallery-${product.id}`,
      type: labels.product,
      title: product.title,
      description: product.short_description,
      href: localePath(locale, `/art-studio/gallery/${product.slug}`)
    }));

  return NextResponse.json(
    { results: [...articleResults, ...businessResults, ...galleryResults, ...categoryResults, ...pageResults] },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } }
  );
}
