import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";
import type { Database, Locale } from "@/lib/types";

export const mediaBucket = "bansko-media";

export function revalidateEditorialPaths() {
  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/articles");
  revalidatePath("/en/articles");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  revalidatePath("/en/feed.xml");
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

  return data;
}
