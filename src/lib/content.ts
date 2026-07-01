import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  categoryDefinitions,
  fallbackHeroImage,
  fallbackNavigationItems,
  fallbackSettings,
  fallbackSocialLinks
} from "@/lib/defaults";
import type { ArticleWithCategory, Category, MediaItem, NavigationItem, SiteSettings, SocialLink, Tag } from "@/lib/types";

export { categoryDefinitions, fallbackHeroImage, fallbackNavigationItems, fallbackSettings, fallbackSocialLinks };

const sampleArticle: ArticleWithCategory = {
  id: "sample",
  title: "Животът в Банско отблизо",
  slug: "zhivotat-v-bansko-otblizo",
  excerpt:
    "Първи поглед към Bansko NOW като дигитално списание за събития, природа, култура и местен живот.",
  content:
    "## Добре дошли в Bansko NOW\n\nBansko NOW е създаден като бързо, красиво и практично място за ежедневно публикуване на истории от Банско и Пирин.\n\n## Какво ще откривате тук\n\n- събития и идеи за седмицата\n- пътеводители за разходки и места\n- култура, природа и местни истории\n- визуални проекти от Art Studio\n\n> Най-добрите местни платформи започват с редовно публикуване и ясна редакторска гледна точка.",
  status: "published",
  category_id: "living",
  category: categoryDefinitions.find((category) => category.slug === "living") ?? null,
  categories: categoryDefinitions.find((category) => category.slug === "living") ?? null,
  featured_image_url: fallbackHeroImage,
  featured_image_alt: "Планински пейзаж, вдъхновен от Банско и Пирин",
  published_at: new Date().toISOString(),
  scheduled_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  seo_title: "Животът в Банско отблизо | Bansko NOW",
  seo_description: "Дигитално списание за събития, култура, природа и живот в Банско.",
  focus_keyword: "Банско",
  canonical_url: null,
  og_title: null,
  og_description: null,
  og_image_url: fallbackHeroImage,
  robots_index: true,
  robots_follow: true,
  reading_time: 2,
  author_name: "Любо Канелов",
  source_links: [],
  internal_link_suggestions: ["/events", "/nature"],
  schema_type: "Article",
  is_featured: true,
  is_homepage_highlight: true,
  show_facebook_cta: true,
  show_art_studio_block: true,
  show_bansko_collection_block: true,
  tags: []
};

function normalizeArticle(article: ArticleWithCategory): ArticleWithCategory {
  return {
    ...article,
    category: article.category ?? article.categories ?? null,
    categories: article.categories ?? article.category ?? null
  };
}

export function getArticleCategory(article: ArticleWithCategory) {
  return article.category ?? article.categories ?? null;
}

export function getArticlePath(article: ArticleWithCategory) {
  const category = getArticleCategory(article);
  return `/${category?.slug || "articles"}/${article.slug}`;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fallbackSettings;
  }

  const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  return data ?? fallbackSettings;
}

export async function getNavigationItems(): Promise<NavigationItem[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fallbackNavigationItems;
  }

  const { data, error } = await supabase
    .from("navigation_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error || !data?.length) {
    return fallbackNavigationItems;
  }

  return data as NavigationItem[];
}

export async function getAllNavigationItems(): Promise<NavigationItem[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fallbackNavigationItems;
  }

  const { data, error } = await supabase
    .from("navigation_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error || !data?.length) {
    return fallbackNavigationItems;
  }

  return data as NavigationItem[];
}

export async function getSocialLinks(settings?: SiteSettings): Promise<SocialLink[]> {
  const resolvedSettings = settings ?? (await getSiteSettings());
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fallbackSocialLinks(resolvedSettings);
  }

  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error || !data?.length) {
    return fallbackSocialLinks(resolvedSettings);
  }

  return data as SocialLink[];
}

export async function getAllSocialLinks(settings?: SiteSettings): Promise<SocialLink[]> {
  const resolvedSettings = settings ?? (await getSiteSettings());
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fallbackSocialLinks(resolvedSettings);
  }

  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error || !data?.length) {
    return fallbackSocialLinks(resolvedSettings);
  }

  return data as SocialLink[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return categoryDefinitions;
  }

  const { data, error } = await supabase.from("categories").select("*").order("created_at");

  if (error) {
    return categoryDefinitions;
  }

  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return categoryDefinitions.find((category) => category.slug === slug) ?? null;
  }

  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    return categoryDefinitions.find((category) => category.slug === slug) ?? null;
  }

  return data ?? null;
}

export async function getPublishedArticles(options?: {
  limit?: number;
  categorySlug?: string;
  featured?: boolean;
}): Promise<ArticleWithCategory[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (options?.categorySlug && options.categorySlug !== getArticleCategory(sampleArticle)?.slug) {
      return [];
    }

    return [sampleArticle].slice(0, options?.limit ?? 10);
  }

  let query = supabase
    .from("articles")
    .select("*, category:categories(*)")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (options?.featured) {
    query = query.eq("is_featured", true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  let articles = ((data ?? []) as unknown as ArticleWithCategory[]).map(normalizeArticle);

  if (options?.categorySlug) {
    articles = articles.filter((article) => getArticleCategory(article)?.slug === options.categorySlug);
  }

  return articles;
}

export async function getAllAdminArticles(): Promise<ArticleWithCategory[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("articles")
    .select("*, category:categories(*)")
    .order("updated_at", { ascending: false });

  return ((data ?? []) as unknown as ArticleWithCategory[]).map(normalizeArticle);
}

export async function getAdminArticleById(id: string): Promise<ArticleWithCategory | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("articles")
    .select("*, category:categories(*)")
    .eq("id", id)
    .maybeSingle();

  return data ? normalizeArticle(data as unknown as ArticleWithCategory) : null;
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithCategory | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return slug === sampleArticle.slug ? sampleArticle : null;
  }

  const { data } = await supabase
    .from("articles")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .maybeSingle();

  return data ? normalizeArticle(data as unknown as ArticleWithCategory) : null;
}

export async function getRelatedArticles(article: ArticleWithCategory, limit = 3) {
  const category = getArticleCategory(article);
  const articles = await getPublishedArticles({ categorySlug: category?.slug, limit: limit + 1 });
  return articles.filter((item) => item.id !== article.id).slice(0, limit);
}

export async function getTagsForArticle(articleId: string): Promise<Tag[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("article_tags")
    .select("tags(*)")
    .eq("article_id", articleId);

  return ((data ?? []) as unknown as { tags: Tag | null }[])
    .map((row) => row.tags)
    .filter(Boolean) as Tag[];
}

export async function getMediaItems(limit = 24): Promise<MediaItem[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as MediaItem[];
}
