"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { estimateReadingTime } from "@/lib/seo";
import { slugify } from "@/lib/slug";
import { hasAdminRole, requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

const mediaBucket = "bansko-media";
const maxUploadSize = 8 * 1024 * 1024;
const maxVideoUploadSize = 80 * 1024 * 1024;

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rawStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function integerValue(formData: FormData, key: string, fallback = 0) {
  const value = stringValue(formData, key);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function uuidValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function looksExternalUrl(value: string) {
  return /^(https?:|mailto:|tel:)/i.test(value);
}

function jsonLines(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) {
    return [];
  }

  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeDate(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

function revalidateEditorialPaths() {
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}

function revalidateSiteChrome() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/admin/settings");
}

function storagePathFromPublicUrl(fileUrl: string | null) {
  if (!fileUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${mediaBucket}/`;

  try {
    const parsed = new URL(fileUrl);
    const markerIndex = parsed.pathname.indexOf(marker);

    return markerIndex >= 0 ? decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length)) : null;
  } catch {
    const markerIndex = fileUrl.indexOf(marker);
    const rawPath = markerIndex >= 0 ? fileUrl.slice(markerIndex + marker.length).split("?")[0] : null;

    return rawPath ? decodeURIComponent(rawPath) : null;
  }
}

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/admin/login?error=missing-env");
  }

  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");

  if (!email || !password) {
    redirect("/admin/login?error=missing-fields");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/admin/login?error=invalid-login");
  }

  if (!hasAdminRole(data.user)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

async function syncTags(articleId: string, tagsInput: string | null) {
  const { supabase } = await requireAdmin();
  const tags = (tagsInput || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  await supabase.from("article_tags").delete().eq("article_id", articleId);

  for (const tagName of tags) {
    const slug = slugify(tagName);
    if (!slug) {
      continue;
    }

    const { data: tag } = await supabase
      .from("tags")
      .upsert({ name: tagName, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (tag?.id) {
      await supabase.from("article_tags").insert({ article_id: articleId, tag_id: tag.id });
    }
  }
}

export async function upsertArticleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = stringValue(formData, "id");
  const title = stringValue(formData, "title") || "Нова статия";
  const content = rawStringValue(formData, "content");
  const intent = stringValue(formData, "intent");
  const selectedStatus = (stringValue(formData, "status") || "draft") as "draft" | "published" | "scheduled";
  const status = intent === "publish" ? "published" : selectedStatus;
  const publishedAt =
    status === "published"
      ? normalizeDate(stringValue(formData, "published_at")) || new Date().toISOString()
      : normalizeDate(stringValue(formData, "published_at"));

  const payload = {
    title,
    slug: stringValue(formData, "slug") || slugify(title),
    excerpt: stringValue(formData, "excerpt"),
    content,
    category_id: stringValue(formData, "category_id"),
    featured_image_url: stringValue(formData, "featured_image_url"),
    featured_image_alt: stringValue(formData, "featured_image_alt"),
    status,
    published_at: publishedAt,
    scheduled_at: normalizeDate(stringValue(formData, "scheduled_at")),
    seo_title: stringValue(formData, "seo_title"),
    seo_description: stringValue(formData, "seo_description"),
    focus_keyword: stringValue(formData, "focus_keyword"),
    canonical_url: stringValue(formData, "canonical_url"),
    og_title: stringValue(formData, "og_title"),
    og_description: stringValue(formData, "og_description"),
    og_image_url: stringValue(formData, "og_image_url"),
    robots_index: booleanValue(formData, "robots_index"),
    robots_follow: booleanValue(formData, "robots_follow"),
    reading_time: estimateReadingTime(content),
    author_name: stringValue(formData, "author_name") || "Любо Канелов",
    source_links: jsonLines(formData, "source_links_input"),
    internal_link_suggestions: jsonLines(formData, "internal_link_suggestions_input"),
    schema_type: stringValue(formData, "schema_type") || "Article",
    is_featured: booleanValue(formData, "is_featured"),
    is_homepage_highlight: booleanValue(formData, "is_homepage_highlight"),
    show_facebook_cta: booleanValue(formData, "show_facebook_cta"),
    show_art_studio_block: booleanValue(formData, "show_art_studio_block"),
    show_bansko_collection_block: booleanValue(formData, "show_bansko_collection_block")
  };

  const result = id
    ? await supabase.from("articles").update(payload).eq("id", id).select("id").single()
    : await supabase.from("articles").insert(payload).select("id").single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message || "Article could not be saved.");
  }

  await syncTags(result.data.id, stringValue(formData, "tags_input"));
  revalidateEditorialPaths();

  redirect(`/admin/articles/${result.data.id}/edit?saved=1`);
}

export async function publishArticleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = stringValue(formData, "id");

  if (!id) {
    return;
  }

  await supabase
    .from("articles")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  revalidateEditorialPaths();
  revalidatePath("/admin/articles");
}

export async function deleteArticleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/articles?error=missing-id");
  }

  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    redirect(`/admin/articles?error=${encodeURIComponent(error.message)}`);
  }

  revalidateEditorialPaths();
  revalidatePath("/admin/articles");
  redirect("/admin/articles?deleted=1");
}

export async function deleteCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/categories?error=missing-id");
  }

  const { data: category } = await supabase.from("categories").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  }

  revalidateEditorialPaths();
  revalidatePath("/admin/categories");
  revalidatePath("/admin/articles");

  if (category?.slug) {
    revalidatePath(`/${category.slug}`);
  }

  redirect("/admin/categories?deleted=1");
}

export async function deleteMediaAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/media?error=missing-id");
  }

  const { data: mediaItem } = await supabase.from("media").select("file_url").eq("id", id).maybeSingle();
  const storagePath = storagePathFromPublicUrl(mediaItem?.file_url ?? null);

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(mediaBucket).remove([storagePath]);

    if (storageError) {
      redirect(`/admin/media?error=${encodeURIComponent(storageError.message)}`);
    }
  }

  const { error } = await supabase.from("media").delete().eq("id", id);

  if (error) {
    redirect(`/admin/media?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/media");
  redirect("/admin/media?deleted=1");
}

export async function uploadMediaAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/media?error=missing-file");
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    redirect("/admin/media?error=invalid-type");
  }

  if ((isImage && file.size > maxUploadSize) || (isVideo && file.size > maxVideoUploadSize)) {
    redirect("/admin/media?error=file-too-large");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeName = slugify(baseName) || "image";
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const storagePath = `articles/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(mediaBucket).upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) {
    redirect(`/admin/media?error=${encodeURIComponent(uploadError.message)}`);
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(mediaBucket).getPublicUrl(storagePath);

  const { error: mediaError } = await supabase.from("media").insert({
    file_url: publicUrl,
    file_name: file.name,
    alt_text: stringValue(formData, "alt_text"),
    caption: stringValue(formData, "caption")
  });

  if (mediaError) {
    redirect(`/admin/media?error=${encodeURIComponent(mediaError.message)}`);
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function saveSettingsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = stringValue(formData, "id");
  const requestedHeroMediaType = stringValue(formData, "hero_media_type");
  const heroMediaType: SiteSettings["hero_media_type"] =
    requestedHeroMediaType === "video" || requestedHeroMediaType === "embed" ? requestedHeroMediaType : "image";
  const payload = {
    site_name: stringValue(formData, "site_name") || "Bansko NOW",
    site_description: stringValue(formData, "site_description"),
    facebook_group_url: stringValue(formData, "facebook_group_url"),
    instagram_url: stringValue(formData, "instagram_url"),
    youtube_url: stringValue(formData, "youtube_url"),
    default_og_image: stringValue(formData, "default_og_image"),
    hero_media_type: heroMediaType,
    hero_image_url: stringValue(formData, "hero_image_url"),
    hero_image_alt: stringValue(formData, "hero_image_alt"),
    hero_video_url: stringValue(formData, "hero_video_url"),
    hero_video_poster_url: stringValue(formData, "hero_video_poster_url"),
    hero_embed_url: stringValue(formData, "hero_embed_url"),
    default_author_name: stringValue(formData, "default_author_name") || "Любо Канелов"
  };

  const { error } = id
    ? await supabase.from("site_settings").update(payload).eq("id", id)
    : await supabase.from("site_settings").insert(payload);

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function saveNavigationAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const rowKeys = formData
    .getAll("navigation_row_key")
    .map((value) => (typeof value === "string" ? value : null))
    .filter(Boolean) as string[];

  for (const rowKey of rowKeys) {
    const id = uuidValue(formData, `navigation_id_${rowKey}`);
    const label = stringValue(formData, `navigation_label_${rowKey}`);
    const href = stringValue(formData, `navigation_href_${rowKey}`);
    const shouldDelete = booleanValue(formData, `navigation_delete_${rowKey}`);

    if (shouldDelete) {
      if (id) {
        await supabase.from("navigation_items").delete().eq("id", id);
      }
      continue;
    }

    if (!label || !href) {
      continue;
    }

    const payload = {
      label,
      href,
      icon_name: stringValue(formData, `navigation_icon_name_${rowKey}`),
      sort_order: integerValue(formData, `navigation_sort_order_${rowKey}`),
      is_external: booleanValue(formData, `navigation_is_external_${rowKey}`) || looksExternalUrl(href),
      open_in_new_tab: booleanValue(formData, `navigation_open_in_new_tab_${rowKey}`),
      is_active: booleanValue(formData, `navigation_is_active_${rowKey}`),
      aria_label: stringValue(formData, `navigation_aria_label_${rowKey}`)
    };

    if (id) {
      await supabase.from("navigation_items").update(payload).eq("id", id);
    } else {
      await supabase.from("navigation_items").upsert(payload, { onConflict: "href" });
    }
  }

  revalidateSiteChrome();
}

export async function saveSocialLinksAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const rowKeys = formData
    .getAll("social_row_key")
    .map((value) => (typeof value === "string" ? value : null))
    .filter(Boolean) as string[];

  for (const rowKey of rowKeys) {
    const id = uuidValue(formData, `social_id_${rowKey}`);
    const platform = stringValue(formData, `social_platform_${rowKey}`);
    const label = stringValue(formData, `social_label_${rowKey}`);
    const url = stringValue(formData, `social_url_${rowKey}`);
    const shouldDelete = booleanValue(formData, `social_delete_${rowKey}`);

    if (shouldDelete) {
      if (id) {
        await supabase.from("social_links").delete().eq("id", id);
      }
      continue;
    }

    if (!platform || !label || !url) {
      continue;
    }

    const payload = {
      platform: platform.toLowerCase(),
      label,
      url,
      icon_name: stringValue(formData, `social_icon_name_${rowKey}`) || platform.toLowerCase(),
      sort_order: integerValue(formData, `social_sort_order_${rowKey}`),
      is_active: booleanValue(formData, `social_is_active_${rowKey}`)
    };

    if (id) {
      await supabase.from("social_links").update(payload).eq("id", id);
    } else {
      await supabase.from("social_links").upsert(payload, { onConflict: "platform" });
    }
  }

  revalidateSiteChrome();
}
