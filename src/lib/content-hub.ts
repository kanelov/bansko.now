import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { mediaBucket, revalidateEditorialPaths, revalidateLocalePath, syncTags } from "@/lib/articles-admin";
import { createImageVariants } from "@/lib/image-variants";
import { getSupabaseConfig } from "@/lib/env";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { estimateReadingTime } from "@/lib/seo";
import { slugify } from "@/lib/slug";
import type { Article, Database, Locale } from "@/lib/types";

/**
 * Server-side bridge for the Content Hub (the request app). The hub sends an
 * approved article; Bansko NOW stores it in its own Supabase project. Nothing here
 * talks to the hub's database.
 */

export class ContentHubError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export type ContentHubPayload = {
  content_hub_item_id: string;
  locale: Locale;
  status: "published" | "draft";
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  fallback_category: string;
  tags: string[];
  featured_image_url: string;
  featured_image_alt: string;
  image_caption: string;
  source_url: string;
  source_links: string[];
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  schema_type: string;
  author_name: string;
  article_type: string;
};

export type ContentHubCategory = {
  id: string;
  slug: string;
  name: string;
  locale: Locale;
  hidden: boolean;
};

type CategoryRow = { id: string; slug: string; name: string; is_visible: boolean | null };
type TranslationRow = { category_id: string; locale: string; name: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const schemaTypes = new Set(["Article", "NewsArticle", "BlogPosting"]);
const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};
const maxImageBytes = 12 * 1024 * 1024;

function text(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function httpUrl(value: unknown) {
  const candidate = text(value, 1000);
  return /^https?:\/\/\S+$/i.test(candidate) ? candidate : "";
}

function list(value: unknown, maxItems: number, maxLength: number) {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(/[\n,;|]+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of raw) {
    const cleaned = text(entry, maxLength);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }

  return result;
}

function boolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return fallback;
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bg");
}

export function parseContentHubPayload(input: unknown): ContentHubPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ContentHubError(400, "Очаква се JSON обект.");
  }

  const raw = input as Record<string, unknown>;
  const errors: string[] = [];
  const itemId = text(raw.content_hub_item_id, 40);
  const title = text(raw.title, 300);
  const content = String(raw.content ?? "").replace(/\r\n?/g, "\n").trim();
  const localeValue = text(raw.locale, 5).toLowerCase();
  const locale: Locale = isLocale(localeValue) ? localeValue : "bg";
  const format = text(raw.content_format, 10).toLowerCase() || "markdown";
  const schemaType = text(raw.schema_type, 40);

  if (!uuidPattern.test(itemId)) errors.push("content_hub_item_id трябва да е UUID.");
  if (!title) errors.push("Липсва заглавие.");
  if (content.length < 20) errors.push("Текстът е празен или твърде кратък.");
  if (format !== "markdown") errors.push("Bansko NOW приема само Markdown съдържание.");

  if (errors.length) {
    throw new ContentHubError(422, errors.join(" "), { errors });
  }

  return {
    content_hub_item_id: itemId.toLowerCase(),
    locale,
    status: text(raw.status, 20) === "draft" ? "draft" : "published",
    title,
    slug: slugify(text(raw.slug, 200)) || slugify(title),
    excerpt: text(raw.excerpt, 600),
    content,
    category: text(raw.category, 120),
    fallback_category: text(raw.fallback_category, 120),
    tags: list(raw.tags, 30, 60),
    featured_image_url: httpUrl(raw.featured_image_url),
    featured_image_alt: text(raw.featured_image_alt, 300),
    image_caption: text(raw.image_caption, 400),
    source_url: httpUrl(raw.source_url),
    source_links: list(raw.source_links, 20, 500).filter((entry) => /^https?:\/\//i.test(entry)),
    seo_title: text(raw.seo_title, 200),
    seo_description: text(raw.seo_description, 400),
    focus_keyword: text(raw.focus_keyword, 120),
    canonical_url: httpUrl(raw.canonical_url),
    og_title: text(raw.og_title, 200),
    og_description: text(raw.og_description, 400),
    og_image_url: httpUrl(raw.og_image_url),
    robots_index: boolean(raw.robots_index, true),
    robots_follow: boolean(raw.robots_follow, true),
    schema_type: schemaTypes.has(schemaType) ? schemaType : "Article",
    author_name: text(raw.author_name, 120),
    article_type: text(raw.article_type, 40).toLowerCase()
  };
}

async function loadCategories(supabase: SupabaseClient<Database>) {
  const { data: categories, error } = await supabase.from("categories").select("id, slug, name, is_visible").order("created_at");

  if (error) {
    throw new ContentHubError(500, `Категориите не могат да бъдат прочетени: ${error.message}`);
  }

  const { data: translations } = await supabase.from("category_translations").select("category_id, locale, name");

  return {
    categories: (categories ?? []) as CategoryRow[],
    translations: (translations ?? []) as TranslationRow[]
  };
}

export async function listContentHubCategories(supabase: SupabaseClient<Database>): Promise<ContentHubCategory[]> {
  const { categories, translations } = await loadCategories(supabase);
  const result: ContentHubCategory[] = [];

  for (const category of categories) {
    const own = translations.filter((translation) => translation.category_id === category.id);
    const bgName = own.find((translation) => translation.locale === "bg")?.name || category.name;
    const hidden = category.is_visible === false;
    result.push({ id: category.id, slug: category.slug, name: bgName, locale: "bg", hidden });

    const en = own.find((translation) => translation.locale === "en");
    if (en?.name) {
      result.push({ id: category.id, slug: category.slug, name: en.name, locale: "en", hidden });
    }
  }

  return result;
}

async function resolveCategory(supabase: SupabaseClient<Database>, payload: ContentHubPayload) {
  const { categories, translations } = await loadCategories(supabase);
  const candidates = [payload.category, payload.fallback_category].filter(Boolean);

  for (const candidate of candidates) {
    const wanted = normalizeName(candidate);
    const wantedSlug = slugify(candidate);

    const bySlug = categories.find((category) => category.slug === wanted || (wantedSlug && category.slug === wantedSlug));
    if (bySlug) return bySlug;

    const translation = translations.find((entry) => normalizeName(entry.name) === wanted);
    if (translation) {
      const category = categories.find((entry) => entry.id === translation.category_id);
      if (category) return category;
    }

    const byName = categories.find((category) => normalizeName(category.name) === wanted);
    if (byName) return byName;
  }

  throw new ContentHubError(
    422,
    `Категорията „${payload.category || "(празна)"}“ не съществува в Bansko NOW. Налични: ${categories.map((category) => category.slug).join(", ")}.`,
    { available_categories: categories.map((category) => category.slug) }
  );
}

async function copyFeaturedImage(
  supabase: SupabaseClient<Database>,
  payload: ContentHubPayload,
  warnings: string[]
) {
  const sourceUrl = payload.featured_image_url;
  if (!sourceUrl) return "";

  const config = getSupabaseConfig();
  const ownPrefix = config ? `${config.url}/storage/v1/object/public/${mediaBucket}/` : "";
  if (ownPrefix && sourceUrl.startsWith(ownPrefix)) return sourceUrl;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    let response: Response;

    try {
      response = await fetch(sourceUrl, {
        headers: { Accept: "image/*", "User-Agent": "BanskoNOW-ContentHub/1.0" },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const extension = imageExtensions[contentType];
    if (!extension) throw new Error(`неподдържан тип ${contentType || "(неизвестен)"}`);

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > maxImageBytes) throw new Error("файлът е над 12 MB");
    if (bytes.byteLength < 200) throw new Error("файлът е празен");

    // Deterministic id per item: a re-publish in the same month refreshes the same files.
    const variant = await createImageVariants(supabase, {
      buffer: bytes,
      id: payload.content_hub_item_id,
      cacheControl: "31536000"
    });
    const publicUrl = variant.url;

    const { data: existingMedia } = await supabase.from("media").select("id").eq("file_url", publicUrl).maybeSingle();
    if (!existingMedia) {
      await supabase.from("media").insert({
        file_url: publicUrl,
        file_name: `${payload.slug || payload.content_hub_item_id}.webp`,
        alt_text: payload.featured_image_alt || payload.title,
        caption: payload.image_caption || null
      });
    }

    return publicUrl;
  } catch (error) {
    warnings.push(
      `Снимката не е копирана в Bansko NOW (${error instanceof Error ? error.message : "грешка"}). Използва се оригиналният линк.`
    );
    return sourceUrl;
  }
}

export async function publishContentHubArticle(supabase: SupabaseClient<Database>, payload: ContentHubPayload) {
  const warnings: string[] = [];
  const category = await resolveCategory(supabase, payload);

  const { data: existing, error: existingError } = await supabase
    .from("articles")
    .select("id, slug, status, published_at")
    .eq("content_hub_item_id", payload.content_hub_item_id)
    .maybeSingle();

  if (existingError) {
    throw new ContentHubError(500, existingError.message);
  }

  const featuredImageUrl = await copyFeaturedImage(supabase, payload, warnings);
  const now = new Date().toISOString();
  const publish = payload.status === "published";
  const baseSlug = payload.slug || `statiya-${payload.content_hub_item_id.slice(0, 8)}`;

  const record: Partial<Article> = {
    title: payload.title,
    excerpt: payload.excerpt || null,
    content: payload.content,
    category_id: category.id,
    featured_image_url: featuredImageUrl || null,
    featured_image_alt: payload.featured_image_alt || payload.title,
    image_caption: payload.image_caption || null,
    status: publish ? "published" : "draft",
    published_at: publish ? existing?.published_at ?? now : null,
    scheduled_at: null,
    seo_title: payload.seo_title || null,
    seo_description: payload.seo_description || null,
    focus_keyword: payload.focus_keyword || null,
    canonical_url: payload.canonical_url || null,
    og_title: payload.og_title || null,
    og_description: payload.og_description || null,
    og_image_url: payload.og_image_url || featuredImageUrl || null,
    robots_index: payload.robots_index,
    robots_follow: payload.robots_follow,
    reading_time: estimateReadingTime(payload.content),
    author_name: payload.author_name || "Любо Канелов",
    source_links: payload.source_links,
    schema_type: payload.schema_type,
    locale: payload.locale,
    show_facebook_cta: true,
    show_art_studio_block: true,
    show_bansko_collection_block: false,
    automation_source: "content_hub",
    automation_last_imported_at: now,
    content_hub_item_id: payload.content_hub_item_id,
    ...(payload.article_type ? { article_type: payload.article_type } : {})
  };

  let articleId: string | null = null;
  let finalSlug = baseSlug;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    finalSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const result = existing
      ? await supabase.from("articles").update({ ...record, slug: finalSlug }).eq("id", existing.id).select("id").single()
      : await supabase
          .from("articles")
          .insert({ ...record, title: payload.title, content: payload.content, slug: finalSlug, translation_group_id: randomUUID() })
          .select("id")
          .single();

    if (!result.error && result.data?.id) {
      articleId = result.data.id;
      break;
    }

    if (result.error?.code === "23505" && /slug/i.test(result.error.message)) {
      continue;
    }

    throw new ContentHubError(500, result.error?.message || "Статията не можа да бъде записана.");
  }

  if (!articleId) {
    throw new ContentHubError(409, `Няма свободен slug за „${baseSlug}“.`);
  }

  if (publish && category.is_visible === false) {
    await supabase.from("categories").update({ is_visible: true }).eq("id", category.id);
    warnings.push(`Категорията „${category.slug}“ беше скрита и вече е видима в менюто.`);
  }

  try {
    await syncTags(supabase, articleId, payload.tags.join(", "), payload.locale);
  } catch (error) {
    warnings.push(`Таговете не са записани: ${error instanceof Error ? error.message : "грешка"}`);
  }

  const path = `/${category.slug}/${finalSlug}`;
  revalidateEditorialPaths();
  revalidateLocalePath(payload.locale, path);
  revalidateLocalePath(payload.locale, `/${category.slug}`);
  revalidatePath("/admin/articles");
  if (existing && existing.slug !== finalSlug) {
    revalidateLocalePath(payload.locale, `/${category.slug}/${existing.slug}`);
  }

  return {
    id: articleId,
    slug: finalSlug,
    status: record.status,
    url: localeUrl(payload.locale, path),
    updated: Boolean(existing),
    warnings
  };
}
