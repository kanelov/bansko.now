import { NextResponse } from "next/server";
import { getApprovedBusinesses } from "@/lib/businesses";
import { getBusinessPath } from "@/lib/business-public";
import { getArticlePath, getCategories, getEditablePages, getPublishedArticles } from "@/lib/content";
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

  const [articles, businesses, categories, pages] = await Promise.all([
    getPublishedArticles({ limit: 100, locale }),
    getApprovedBusinesses(locale),
    getCategories(locale),
    getEditablePages({ locale })
  ]);
  const labels = locale === "en"
    ? { article: "Article", business: "Business", category: "Category", page: "Page" }
    : { article: "Статия", business: "Бизнес", category: "Категория", page: "Страница" };

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

  return NextResponse.json(
    { results: [...articleResults, ...businessResults, ...categoryResults, ...pageResults] },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
