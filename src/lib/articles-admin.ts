import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";
import { photoCodesInContent } from "@/lib/photos";
import type { Database, Locale } from "@/lib/types";

export const mediaBucket = "bansko-media";

/**
 * Public BG URLs carry no locale prefix (/now), but they render under /bg/now because
 * src/proxy.ts rewrites them. revalidatePath matches the internal route, so a BG path only
 * clears its cache with the prefix; without it a publish waits for the 15 minute ISR window.
 */
export function revalidateLocalePath(locale: Locale, path = "/", type?: "layout" | "page") {
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const withoutLocale = normalized.replace(/^\/(bg|en)(?=\/|$)/, "");
  revalidatePath(`/${locale}${withoutLocale}`, type);
}

/** Same, for a path that exists in both locales. */
export function revalidatePublicPath(path = "/", type?: "layout" | "page") {
  revalidateLocalePath("bg", path, type);
  revalidateLocalePath("en", path, type);
}

export function revalidateEditorialPaths() {
  revalidatePublicPath("/");
  revalidatePublicPath("/articles");
  revalidatePublicPath("/feed.xml");
  revalidatePath("/sitemap.xml");
}

export async function syncTags(
  supabase: SupabaseClient<Database>,
  articleId: string,
  tagsInput: string | null,
  locale: Locale
) {
  const tags = (tagsInput || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { error: deleteError } = await supabase.from("article_tags").delete().eq("article_id", articleId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  for (const tagName of tags) {
    const slug = slugify(tagName);
    if (!slug) {
      continue;
    }

    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ name: tagName, slug, locale }, { onConflict: "locale,slug" })
      .select("id")
      .single();

    if (tagError) {
      throw new Error(tagError.message);
    }

    if (tag?.id) {
      const { error: linkError } = await supabase.from("article_tags").insert({ article_id: articleId, tag_id: tag.id });

      if (linkError) {
        throw new Error(linkError.message);
      }
    }
  }
}

export async function publishArticleRecord(supabase: SupabaseClient<Database>, articleId: string) {
  const { data, error } = await supabase
    .from("articles")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      scheduled_at: null
    })
    .eq("id", articleId)
    .select("id, title, slug, status, published_at, scheduled_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Статията не можа да бъде публикувана.");
  }

  await ensureArticleCategoryVisible(supabase, articleId);

  return data;
}

/**
 * Blog categories stay hidden until they have content. Publishing an article into a hidden
 * category makes the category public again (menu, sitemap, category page).
 */
export async function ensureArticleCategoryVisible(supabase: SupabaseClient<Database>, articleId: string) {
  const { data: article } = await supabase.from("articles").select("category_id").eq("id", articleId).maybeSingle();

  if (!article?.category_id) {
    return;
  }

  await supabase.from("categories").update({ is_visible: true }).eq("id", article.category_id).eq("is_visible", false);
}

/**
 * Records which photo library images an article uses. Called after every save: the featured
 * image and the body are scanned for R2 photo keys and article_photos is brought in line.
 */
export async function syncArticlePhotos(
  supabase: SupabaseClient<Database>,
  articleId: string,
  featuredImageUrl: string | null | undefined,
  content: string | null | undefined
) {
  const featuredCodes = photoCodesInContent(featuredImageUrl);
  const bodyCodes = photoCodesInContent(content).filter((code) => !featuredCodes.includes(code));
  const codes = [...featuredCodes, ...bodyCodes];

  if (!codes.length) {
    await supabase.from("article_photos").delete().eq("article_id", articleId);
    return;
  }

  const { data: photos } = await supabase.from("photos").select("id,photo_code").in("photo_code", codes);
  const idByCode = new Map((photos ?? []).map((photo) => [photo.photo_code, photo.id]));
  const rows = codes
    .map((code, index) => {
      const photoId = idByCode.get(code);
      if (!photoId) return null;
      return {
        article_id: articleId,
        photo_id: photoId,
        usage_type: featuredCodes.includes(code) ? ("featured" as const) : ("inline" as const),
        sort_order: index
      };
    })
    .filter((row): row is { article_id: string; photo_id: string; usage_type: "featured" | "inline"; sort_order: number } => Boolean(row));

  await supabase.from("article_photos").delete().eq("article_id", articleId);
  if (rows.length) await supabase.from("article_photos").insert(rows);
}
