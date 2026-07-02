import { NextResponse } from "next/server";
import { getArticlePath } from "@/lib/content";
import { getBusinessPath } from "@/lib/business-public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleWithCategory, Business, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${query.replaceAll("%", "").replaceAll("_", "")}%`;
  const [articlesResult, businessesResult, categoriesResult] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, slug, excerpt, published_at, category:categories(id, name, slug, description, seo_title, seo_description)")
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("businesses")
      .select("id, name, slug, category, address, description")
      .eq("status", "approved")
      .or(`name.ilike.${pattern},category.ilike.${pattern},address.ilike.${pattern},description.ilike.${pattern}`)
      .order("priority", { ascending: true })
      .limit(5),
    supabase
      .from("categories")
      .select("id, name, slug, description, seo_title, seo_description")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .limit(4)
  ]);

  const articles = ((articlesResult.data ?? []) as unknown as ArticleWithCategory[]).map((article) => ({
    id: `article-${article.id}`,
    type: "Статия",
    title: article.title,
    description: article.excerpt,
    href: getArticlePath(article)
  }));
  const businesses = ((businessesResult.data ?? []) as unknown as Business[]).map((business) => ({
    id: `business-${business.id}`,
    type: "Бизнес",
    title: business.name,
    description: `${business.category} · ${business.address}`,
    href: getBusinessPath(business)
  }));
  const categories = ((categoriesResult.data ?? []) as Category[]).map((category) => ({
    id: `category-${category.id}`,
    type: "Категория",
    title: category.name,
    description: category.description,
    href: `/${category.slug}`
  }));

  return NextResponse.json({ results: [...articles, ...businesses, ...categories] });
}
