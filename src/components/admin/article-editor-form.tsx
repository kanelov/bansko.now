"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { publishArticleAction, upsertArticleAction } from "@/app/admin/actions";
import { ArticleTableOfContents } from "@/components/public/article-table-of-contents";
import { BanskoCollectionBlock } from "@/components/public/bansko-collection-block";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { SEOChecklist } from "@/components/admin/seo-checklist";
import { ContentDocumentTools } from "@/components/admin/content-document-tools";
import { fallbackSettings } from "@/lib/defaults";
import { articleDocumentFields, type ContentDocumentMetadata, type ContentDocumentValue } from "@/lib/content-transfer";
import { getArticleToc } from "@/lib/markdown-blocks";
import { getSeoScore } from "@/lib/seo";
import { slugify } from "@/lib/slug";
import type { ArticleStatus, ArticleWithCategory, Category, Locale, MediaItem, SiteSettings } from "@/lib/types";

type Tab = "content" | "seo" | "images" | "settings" | "preview";

type Draft = {
  locale: Locale;
  translation_group_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string;
  tags_input: string;
  source_links_input: string;
  internal_link_suggestions_input: string;
  focus_keyword: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  featured_image_url: string;
  featured_image_alt: string;
  author_name: string;
  schema_type: string;
  status: ArticleStatus;
  published_at: string;
  scheduled_at: string;
  robots_index: boolean;
  robots_follow: boolean;
  is_featured: boolean;
  is_homepage_highlight: boolean;
  show_facebook_cta: boolean;
  show_art_studio_block: boolean;
  show_bansko_collection_block: boolean;
};

function dateInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function lines(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
}

function ArtStudioPreviewBlock({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const services = locale === "en"
    ? ["Fine Art printing", "Canvas printing", "Visual storytelling"]
    : ["Fine Art печат", "Canvas печат", "Визуално представяне"];

  return (
    <section className="rounded-3xl border border-stone-200 bg-[#f7f2e8] p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase text-moss">{settings.art_studio_block_eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-950">{settings.art_studio_block_title}</h2>
      <p className="mt-4 text-base leading-7 text-stone-650">
        {settings.art_studio_block_text}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {services.map((service) => (
          <div key={service} className="rounded-2xl bg-white p-4 text-sm font-semibold text-stone-800 shadow-soft">
            {service}
          </div>
        ))}
      </div>
    </section>
  );
}

function initialDraft(article?: ArticleWithCategory | null, locale: Locale = "bg", translationGroupId = ""): Draft {
  return {
    locale: article?.locale || locale,
    translation_group_id: article?.translation_group_id || translationGroupId,
    title: article?.title || "",
    slug: article?.slug || "",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    category_id: article?.category_id || "",
    tags_input: article?.tags?.map((tag) => tag.name).join(", ") || "",
    source_links_input: lines(article?.source_links),
    internal_link_suggestions_input: lines(article?.internal_link_suggestions),
    focus_keyword: article?.focus_keyword || "",
    seo_title: article?.seo_title || "",
    seo_description: article?.seo_description || "",
    canonical_url: article?.canonical_url || "",
    og_title: article?.og_title || "",
    og_description: article?.og_description || "",
    og_image_url: article?.og_image_url || "",
    featured_image_url: article?.featured_image_url || "",
    featured_image_alt: article?.featured_image_alt || "",
    author_name: article?.author_name || "Любо Канелов",
    schema_type: article?.schema_type || "Article",
    status: article?.status || "draft",
    published_at: dateInput(article?.published_at),
    scheduled_at: dateInput(article?.scheduled_at),
    robots_index: article?.robots_index ?? true,
    robots_follow: article?.robots_follow ?? true,
    is_featured: article?.is_featured ?? false,
    is_homepage_highlight: article?.is_homepage_highlight ?? false,
    show_facebook_cta: article?.show_facebook_cta ?? true,
    show_art_studio_block: article?.show_art_studio_block ?? false,
    show_bansko_collection_block: article?.show_bansko_collection_block ?? false
  };
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

const tabs: { id: Tab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "seo", label: "SEO" },
  { id: "images", label: "Images" },
  { id: "settings", label: "Settings" },
  { id: "preview", label: "Preview" }
];

const toolbarButtons = [
  { label: "H2", before: "## ", after: "", fallback: "Подзаглавие" },
  { label: "H3", before: "### ", after: "", fallback: "Секция" },
  { label: "B", before: "**", after: "**", fallback: "удебелен текст" },
  { label: "Quote", before: "> ", after: "", fallback: "Важен цитат или акцент" },
  { label: "UL", before: "- ", after: "\n- Втори елемент", fallback: "Първи елемент" },
  { label: "OL", before: "1. ", after: "\n2. Втори елемент", fallback: "Първи елемент" },
  { label: "Link", before: "[", after: "](https://example.com)", fallback: "текст на връзката" },
  { label: "Image", before: "![", after: "](https://example.com/image.jpg)", fallback: "alt текст" }
];

const visualBlocks = [
  {
    label: "Gallery",
    snippet:
      "\n\n:::gallery\n![Описание на снимка](https://example.com/image-1.jpg)\n![Описание на снимка](https://example.com/image-2.jpg)\n:::\n"
  },
  {
    label: "Callout",
    snippet: "\n\n:::callout\ncolor: forest\n\nКратък редакторски акцент, полезен съвет или важна бележка.\n:::\n"
  },
  {
    label: "Text color",
    snippet: "\n\n:::text\ncolor: clay\n\nТекст с избран цвят за редакционен акцент.\n:::\n"
  },
  {
    label: "Video",
    snippet: "\n\n:::video\nhttps://example.com/video.mp4\nКратко описание на видеото.\n:::\n"
  },
  {
    label: "Button",
    snippet: "\n\n:::button\ntext: Виж повече\nurl: https://example.com\nstyle: primary\n:::\n"
  },
  {
    label: "FAQ",
    snippet:
      "\n\n:::faq\ncolor: stone\n\n### Въпрос за Банско?\nКратък и полезен отговор.\n\n### Втори въпрос?\nОще един ясен отговор.\n:::\n"
  }
];

const serializedDraftFields: readonly (keyof Draft)[] = articleDocumentFields;

function importedBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function importDraft(current: Draft, fields: Record<string, string>, metadata: ContentDocumentMetadata): Draft {
  const importedStatus = fields.status === "published" || fields.status === "scheduled" || fields.status === "draft" ? fields.status : current.status;

  return {
    locale: current.locale,
    translation_group_id: current.translation_group_id || metadata.translationGroupId || fields.translation_group_id || "",
    title: fields.title ?? current.title,
    slug: fields.slug ? slugify(fields.slug) : current.slug,
    excerpt: fields.excerpt ?? current.excerpt,
    content: fields.content ?? current.content,
    category_id: fields.category_id ?? current.category_id,
    tags_input: fields.tags_input ?? current.tags_input,
    source_links_input: fields.source_links_input ?? current.source_links_input,
    internal_link_suggestions_input: fields.internal_link_suggestions_input ?? current.internal_link_suggestions_input,
    focus_keyword: fields.focus_keyword ?? current.focus_keyword,
    seo_title: fields.seo_title ?? current.seo_title,
    seo_description: fields.seo_description ?? current.seo_description,
    canonical_url: fields.canonical_url ?? current.canonical_url,
    og_title: fields.og_title ?? current.og_title,
    og_description: fields.og_description ?? current.og_description,
    og_image_url: fields.og_image_url ?? current.og_image_url,
    featured_image_url: fields.featured_image_url ?? current.featured_image_url,
    featured_image_alt: fields.featured_image_alt ?? current.featured_image_alt,
    author_name: fields.author_name ?? current.author_name,
    schema_type: fields.schema_type ?? current.schema_type,
    status: importedStatus,
    published_at: fields.published_at ?? current.published_at,
    scheduled_at: fields.scheduled_at ?? current.scheduled_at,
    robots_index: importedBoolean(fields.robots_index, current.robots_index),
    robots_follow: importedBoolean(fields.robots_follow, current.robots_follow),
    is_featured: importedBoolean(fields.is_featured, current.is_featured),
    is_homepage_highlight: importedBoolean(fields.is_homepage_highlight, current.is_homepage_highlight),
    show_facebook_cta: importedBoolean(fields.show_facebook_cta, current.show_facebook_cta),
    show_art_studio_block: importedBoolean(fields.show_art_studio_block, current.show_art_studio_block),
    show_bansko_collection_block: importedBoolean(fields.show_bansko_collection_block, current.show_bansko_collection_block)
  };
}

function ArticleFormActions({
  isExisting,
  isPublished,
  hasUnsavedChanges
}: {
  isExisting: boolean;
  isPublished: boolean;
  hasUnsavedChanges: boolean;
}) {
  const { pending, data, action } = useFormStatus();
  const pendingIntent = data?.get("intent");
  const isPublishPending = pending && (action === publishArticleAction || pendingIntent === "publish");
  const publishDisabled = isExisting && (isPublished || hasUnsavedChanges);
  const publishTitle = hasUnsavedChanges
    ? "Първо запази редакционните промени, след това публикувай."
    : isPublished
      ? "Статията вече е публикувана."
      : "Публикувай запазената версия на статията.";

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {isExisting && hasUnsavedChanges ? (
        <p className="mr-auto text-sm font-medium text-amber-200">Има незапазени промени. Първо ги запази.</p>
      ) : null}
      <button
        type="submit"
        name="intent"
        value="save"
        disabled={pending}
        className="admin-button admin-button-secondary px-6 py-3 text-sm font-semibold"
      >
        {pending && pendingIntent !== "publish" ? "Запазване..." : isExisting ? "Запази промените" : "Запази чернова"}
      </button>
      {isExisting ? (
        <button
          type="submit"
          formAction={publishArticleAction}
          disabled={pending || publishDisabled}
          title={publishTitle}
          className="admin-button admin-button-primary px-6 py-3 text-sm font-semibold"
        >
          {isPublishPending ? "Публикуване..." : isPublished ? "Публикувана" : "Публикувай"}
        </button>
      ) : (
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          title="Създай и публикувай статията."
          className="admin-button admin-button-primary px-6 py-3 text-sm font-semibold"
        >
          {isPublishPending ? "Публикуване..." : "Публикувай"}
        </button>
      )}
    </div>
  );
}

export function ArticleEditorForm({
  article,
  categories,
  mediaItems = [],
  locale = article?.locale || "bg",
  translationGroupId = article?.translation_group_id || "",
  settings = fallbackSettings
}: {
  article?: ArticleWithCategory | null;
  categories: Category[];
  mediaItems?: MediaItem[];
  locale?: Locale;
  translationGroupId?: string;
  settings?: SiteSettings;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const originalDraft = useMemo(() => initialDraft(article, locale, translationGroupId), [article, locale, translationGroupId]);
  const [draft, setDraft] = useState<Draft>(() => originalDraft);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const previewToc = useMemo(() => getArticleToc(draft.content || ""), [draft.content]);
  const seoArticle = useMemo<Partial<ArticleWithCategory>>(
    () => ({
      ...article,
      ...draft,
      source_links: draft.source_links_input.split(/\n+/).filter(Boolean),
      internal_link_suggestions: draft.internal_link_suggestions_input.split(/\n+/).filter(Boolean),
      featured_image_url: draft.featured_image_url,
      featured_image_alt: draft.featured_image_alt
    }),
    [article, draft]
  );
  const documentValues = useMemo<Record<string, ContentDocumentValue>>(
    () => Object.fromEntries(serializedDraftFields.map((field) => [field, draft[field]])),
    [draft]
  );

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectMediaItem(item: MediaItem) {
    setDraft((current) => ({
      ...current,
      featured_image_url: item.file_url,
      featured_image_alt: current.featured_image_alt || item.alt_text || "",
      og_image_url: current.og_image_url || item.file_url
    }));
  }

  function insertIntoContent(before: string, after = "", fallback = "") {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? draft.content.length;
    const end = textarea?.selectionEnd ?? draft.content.length;
    const selected = draft.content.slice(start, end) || fallback;
    const nextContent = `${draft.content.slice(0, start)}${before}${selected}${after}${draft.content.slice(end)}`;
    const cursor = start + before.length + selected.length + after.length;

    update("content", nextContent);
    window.requestAnimationFrame(() => {
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  function insertSnippet(snippet: string) {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? draft.content.length;
    const nextContent = `${draft.content.slice(0, start)}${snippet}${draft.content.slice(start)}`;

    update("content", nextContent);
    window.requestAnimationFrame(() => {
      const cursor = start + snippet.length;
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  function inputClass() {
    return "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950 outline-none focus:border-forest";
  }

  const score = getSeoScore(seoArticle);
  const tagsDirty = draft.tags_input !== originalDraft.tags_input;
  const hasUnsavedChanges = Boolean(article?.id) && JSON.stringify(draft) !== JSON.stringify(originalDraft);
  const isPublished = article?.status === "published" && !hasUnsavedChanges;

  return (
    <form action={upsertArticleAction} className="grid gap-6">
      {article?.id ? <input type="hidden" name="id" value={article.id} /> : null}
      <input type="hidden" name="editor_loaded" value="true" />
      <input type="hidden" name="tags_dirty" value={tagsDirty ? "true" : "false"} />
      {serializedDraftFields.map((field) => (
        <input key={field} type="hidden" name={field} value={String(draft[field])} />
      ))}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
          {draft.locale === "en" ? "English" : "Български"}
        </span>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="admin-tab"
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto rounded-full bg-sage px-4 py-2 text-sm font-semibold text-forest">SEO {score}/100</span>
      </div>

      <ContentDocumentTools
        documentType="article"
        currentLocale={draft.locale}
        translationGroupId={draft.translation_group_id}
        recordId={article?.id}
        slug={draft.slug || draft.title}
        fieldNames={serializedDraftFields}
        values={documentValues}
        onImport={(fields, metadata) => {
          setDraft((current) => importDraft(current, fields, metadata));
          setActiveTab("content");
        }}
      />

      {activeTab === "content" ? (
        <section className="grid gap-5 rounded-2xl bg-white p-5 text-stone-950">
          <label className="grid gap-2 text-sm font-semibold">
            Title
            <input
              name="title"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              onBlur={() => !draft.slug && update("slug", slugify(draft.title))}
              className={inputClass()}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Slug
            <input
              name="slug"
              value={draft.slug}
              onChange={(event) => update("slug", slugify(event.target.value))}
              className={inputClass()}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Category
            <select
              name="category_id"
              value={draft.category_id}
              onChange={(event) => update("category_id", event.target.value)}
              className={inputClass()}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Tags
            <input
              name="tags_input"
              value={draft.tags_input}
              onChange={(event) => update("tags_input", event.target.value)}
              className={inputClass()}
              placeholder="Пирин, фестивал, разходка"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Excerpt
            <textarea
              name="excerpt"
              value={draft.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              className={inputClass()}
              rows={3}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Main content
            <div className="flex flex-wrap gap-2 rounded-2xl bg-stone-50 p-2">
              {toolbarButtons.map((button) => (
                <button
                  key={button.label}
                  type="button"
                  onClick={() => insertIntoContent(button.before, button.after, button.fallback)}
                  className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-950 transition hover:border-forest"
                >
                  {button.label}
                </button>
              ))}
              {visualBlocks.map((block) => (
                <button
                  key={block.label}
                  type="button"
                  onClick={() => insertSnippet(block.snippet)}
                  className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-moss"
                >
                  {block.label}
                </button>
              ))}
            </div>
            <textarea
              ref={contentRef}
              name="content"
              value={draft.content}
              onChange={(event) => update("content", event.target.value)}
              className={`${inputClass()} min-h-[520px] font-mono leading-6`}
              rows={18}
              required
            />
          </label>
          {mediaItems.length ? (
            <div className="grid gap-3 rounded-2xl bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl font-semibold">Insert media in article</h3>
                <Link href="/admin/media" className="text-sm font-semibold text-forest underline underline-offset-4">
                  Media library
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {mediaItems.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        isVideoUrl(item.file_url)
                          ? `\n\n:::video\n${item.file_url}\n${item.alt_text || item.file_name || "Видео от Bansko NOW"}\n:::\n`
                          : `\n\n![${item.alt_text || item.file_name || "Bansko NOW"}](${item.file_url})\n`
                      )
                    }
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-left text-stone-950 transition hover:-translate-y-0.5 hover:border-forest hover:shadow-soft"
                  >
                    {isVideoUrl(item.file_url) ? (
                      <video src={item.file_url} className="aspect-[4/3] w-full object-cover" muted preload="metadata" />
                    ) : (
                      <img
                        src={item.file_url}
                        alt={item.alt_text || item.file_name || "Bansko NOW media"}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    )}
                    <span className="block truncate px-3 py-2 text-xs font-semibold text-stone-700">
                      {item.alt_text || item.file_name || "Вмъкни снимка"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            Source links
            <textarea
              name="source_links_input"
              value={draft.source_links_input}
              onChange={(event) => update("source_links_input", event.target.value)}
              className={inputClass()}
              rows={4}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Internal link suggestions
            <textarea
              name="internal_link_suggestions_input"
              value={draft.internal_link_suggestions_input}
              onChange={(event) => update("internal_link_suggestions_input", event.target.value)}
              className={inputClass()}
              rows={4}
            />
          </label>
        </section>
      ) : null}

      {activeTab === "seo" ? (
        <section className="grid gap-5 rounded-2xl bg-white p-5 text-stone-950 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-5">
            {[
              ["focus_keyword", "Focus Keyword"],
              ["seo_title", "SEO Title"],
              ["seo_description", "Meta Description"],
              ["canonical_url", "Canonical URL"],
              ["og_title", "OpenGraph Title"],
              ["og_description", "OpenGraph Description"],
              ["og_image_url", "OpenGraph Image"]
            ].map(([name, label]) => (
              <label key={name} className="grid gap-2 text-sm font-semibold">
                {label}
                <input
                  name={name}
                  value={draft[name as keyof Draft] as string}
                  onChange={(event) => update(name as keyof Draft, event.target.value as never)}
                  className={inputClass()}
                />
              </label>
            ))}
            <div className="flex flex-wrap gap-5 text-sm font-semibold">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="robots_index"
                  checked={draft.robots_index}
                  onChange={(event) => update("robots_index", event.target.checked)}
                />
                Robots index
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="robots_follow"
                  checked={draft.robots_follow}
                  onChange={(event) => update("robots_follow", event.target.checked)}
                />
                Robots follow
              </label>
            </div>
          </div>
          <SEOChecklist article={seoArticle} />
        </section>
      ) : null}

      {activeTab === "images" ? (
        <section className="grid gap-5 rounded-2xl bg-white p-5 text-stone-950">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-semibold">
                Featured image URL
                <input
                  name="featured_image_url"
                  value={draft.featured_image_url}
                  onChange={(event) => update("featured_image_url", event.target.value)}
                  className={inputClass()}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Featured image alt text
                <input
                  name="featured_image_alt"
                  value={draft.featured_image_alt}
                  onChange={(event) => update("featured_image_alt", event.target.value)}
                  className={inputClass()}
                />
              </label>
              <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                Качи нови изображения от{" "}
                <Link href="/admin/media" className="font-semibold text-forest underline underline-offset-4">
                  Media
                </Link>
                . Последните качени файлове са достъпни тук за бърз избор.
              </div>
            </div>

            {draft.featured_image_url ? (
              <div className="overflow-hidden rounded-2xl bg-stone-100">
                <img
                  src={draft.featured_image_url}
                  alt={draft.featured_image_alt || draft.title || "Featured image preview"}
                  className="aspect-[4/3] w-full object-cover"
                />
                <p className="p-3 text-xs leading-5 text-stone-600">
                  {draft.featured_image_alt || "Добави alt text, за да бъде изображението полезно за SEO и достъпност."}
                </p>
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-2xl bg-stone-100 p-6 text-center text-sm text-stone-500">
                Избери featured image от media библиотеката или постави URL ръчно.
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-serif text-2xl font-semibold">Media library</h3>
              <Link href="/admin/media" className="text-sm font-semibold text-forest underline underline-offset-4">
                Качи изображение
              </Link>
            </div>
            {mediaItems.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectMediaItem(item)}
                    className={`overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                      draft.featured_image_url === item.file_url ? "border-forest ring-2 ring-forest/20" : "border-stone-200"
                    }`}
                  >
                    {isVideoUrl(item.file_url) ? (
                      <video src={item.file_url} className="aspect-[4/3] w-full object-cover" muted preload="metadata" />
                    ) : (
                      <img
                        src={item.file_url}
                        alt={item.alt_text || item.file_name || "Bansko NOW media"}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    )}
                    <span className="block truncate px-3 py-2 text-xs font-semibold text-stone-700">
                      {item.alt_text || item.file_name || "Изображение"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-stone-600">
                Все още няма качени изображения. Отвори Media, качи снимка и се върни към статията.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="grid gap-5 rounded-2xl bg-white p-5 text-stone-950">
          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                value={draft.status}
                onChange={(event) => update("status", event.target.value as ArticleStatus)}
                className={inputClass()}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Published date
              <input
                type="datetime-local"
                name="published_at"
                value={draft.published_at}
                onChange={(event) => update("published_at", event.target.value)}
                className={inputClass()}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Scheduled date
              <input
                type="datetime-local"
                name="scheduled_at"
                value={draft.scheduled_at}
                onChange={(event) => update("scheduled_at", event.target.value)}
                className={inputClass()}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Author
            <input
              name="author_name"
              value={draft.author_name}
              onChange={(event) => update("author_name", event.target.value)}
              className={inputClass()}
            />
          </label>
          <input type="hidden" name="schema_type" value={draft.schema_type} />
          <div className="grid gap-3 text-sm font-semibold sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["is_featured", "Is featured"],
              ["is_homepage_highlight", "Show on homepage"],
              ["show_facebook_cta", "Show Facebook Group CTA"],
              ["show_art_studio_block", "Show Art Studio block"],
              ["show_bansko_collection_block", "Show Bansko Collection block"]
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 rounded-xl bg-stone-50 p-3">
                <input
                  type="checkbox"
                  name={name}
                  checked={draft[name as keyof Draft] as boolean}
                  onChange={(event) => update(name as keyof Draft, event.target.checked as never)}
                />
                {label}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "preview" ? (
        <section className="grid gap-8 rounded-2xl bg-paper p-5 text-stone-950">
          <article className="mx-auto max-w-[900px]">
            <p className="text-sm font-semibold uppercase text-moss">Preview</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight">{draft.title || "Заглавие"}</h1>
            {draft.excerpt ? <p className="mt-5 text-xl leading-8 text-stone-650">{draft.excerpt}</p> : null}
            {draft.featured_image_url ? (
              <img
                src={draft.featured_image_url}
                alt={draft.featured_image_alt || draft.title}
                className="mt-8 aspect-[16/10] w-full rounded-3xl object-cover"
              />
            ) : null}
            <div className="mt-10">
              <ArticleTableOfContents items={previewToc} locale={draft.locale} />
              <MarkdownRenderer
                content={draft.content || (draft.locale === "en" ? "## Subheading\n\nThe article content will appear here." : "## Подзаглавие\n\nТекстът на статията ще се покаже тук.")}
                locale={draft.locale}
              />
            </div>
          </article>
          <SEOChecklist article={seoArticle} />
          {draft.show_art_studio_block ? <ArtStudioPreviewBlock locale={draft.locale} settings={settings} /> : null}
          {draft.show_bansko_collection_block ? <BanskoCollectionBlock locale={draft.locale} settings={settings} /> : null}
          {draft.show_facebook_cta ? <FacebookGroupCTA settings={settings} locale={draft.locale} /> : null}
        </section>
      ) : null}

      <ArticleFormActions
        isExisting={Boolean(article?.id)}
        isPublished={Boolean(isPublished)}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </form>
  );
}
