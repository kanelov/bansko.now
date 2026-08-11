import type { Locale } from "@/lib/types";

export type ContentDocumentType = "article" | "page";
export type ContentDocumentValue = string | number | boolean | null | undefined;

export type ContentDocumentMetadata = {
  documentType: ContentDocumentType;
  sourceLocale: Locale;
  targetLocale: Locale;
  translationGroupId: string;
  recordId: string;
};

export type ParsedContentDocument = {
  metadata: ContentDocumentMetadata;
  fields: Record<string, string>;
};

export const articleDocumentFields = [
  "locale",
  "translation_group_id",
  "title",
  "slug",
  "excerpt",
  "content",
  "category_id",
  "tags_input",
  "source_links_input",
  "internal_link_suggestions_input",
  "focus_keyword",
  "seo_title",
  "seo_description",
  "canonical_url",
  "og_title",
  "og_description",
  "og_image_url",
  "featured_image_url",
  "featured_image_alt",
  "author_name",
  "schema_type",
  "status",
  "published_at",
  "scheduled_at",
  "robots_index",
  "robots_follow",
  "is_featured",
  "is_homepage_highlight",
  "show_facebook_cta",
  "show_art_studio_block",
  "show_bansko_collection_block"
] as const;

export const editablePageDocumentFields = [
  "locale",
  "translation_group_id",
  "title",
  "slug",
  "status",
  "eyebrow",
  "sort_order",
  "excerpt",
  "content",
  "hero_image_url",
  "hero_image_alt",
  "cta_label",
  "cta_url",
  "seo_title",
  "seo_description",
  "canonical_url",
  "og_image_url",
  "og_title",
  "og_description",
  "schema_type",
  "robots_index",
  "robots_follow"
] as const;

const documentSignature = "<!-- BANSKO_NOW_EXPORT_V1 -->";
const metadataPattern = /<!-- BANSKO_NOW_META:([a-z_]+)=([^\n]*?) -->/g;
const fieldPattern = /<!-- BANSKO_NOW_FIELD:([a-z0-9_]+) -->\n([\s\S]*?)\n<!-- \/BANSKO_NOW_FIELD:\1 -->/g;

function cleanValue(value: ContentDocumentValue) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n+$/g, "");
}

function localeName(locale: Locale) {
  return locale === "en" ? "English" : "Bulgarian";
}

export function getOppositeLocale(locale: Locale): Locale {
  return locale === "bg" ? "en" : "bg";
}

export function prepareTranslationValues(
  values: Record<string, ContentDocumentValue>,
  targetLocale: Locale,
  translationGroupId: string
) {
  return {
    ...values,
    locale: targetLocale,
    translation_group_id: translationGroupId || values.translation_group_id || "",
    status: "draft",
    canonical_url: "",
    published_at: "",
    scheduled_at: ""
  };
}

export function buildContentDocument({
  documentType,
  sourceLocale,
  targetLocale,
  translationGroupId,
  recordId,
  fields,
  fieldNames
}: {
  documentType: ContentDocumentType;
  sourceLocale: Locale;
  targetLocale: Locale;
  translationGroupId: string;
  recordId?: string;
  fields: Record<string, ContentDocumentValue>;
  fieldNames: readonly string[];
}) {
  const instructions = [
    `Translate all human-readable text to ${localeName(targetLocale)}.`,
    "Keep every BANSKO_NOW_FIELD marker and every field name exactly unchanged.",
    "Return the complete document, including fields that stay empty.",
    "Preserve UUIDs, image URLs, external source URLs, booleans and Markdown/native block syntax.",
    `Use a short lowercase Latin slug with hyphens. ${targetLocale === "en" ? "Update internal links to their /en addresses when an English version exists." : "Remove the /en prefix from internal links when a Bulgarian version exists."}`,
    "Do not add an H1 inside the content field because the title is rendered as the page H1.",
    "The imported translation stays a draft and must be reviewed before publishing."
  ];
  const renderedFields = fieldNames.map((name) => {
    const value = cleanValue(fields[name]);
    return `## ${name}\n<!-- BANSKO_NOW_FIELD:${name} -->\n${value}\n<!-- /BANSKO_NOW_FIELD:${name} -->`;
  });

  return [
    documentSignature,
    `<!-- BANSKO_NOW_META:document_type=${documentType} -->`,
    `<!-- BANSKO_NOW_META:source_locale=${sourceLocale} -->`,
    `<!-- BANSKO_NOW_META:target_locale=${targetLocale} -->`,
    `<!-- BANSKO_NOW_META:translation_group_id=${translationGroupId} -->`,
    `<!-- BANSKO_NOW_META:record_id=${recordId || ""} -->`,
    "",
    "# Bansko NOW translation document",
    "",
    "## Instructions for AI",
    ...instructions.map((instruction) => `- ${instruction}`),
    "",
    ...renderedFields,
    ""
  ].join("\n");
}

function readLocale(value: string | undefined, fieldName: string): Locale {
  if (value === "bg" || value === "en") {
    return value;
  }

  throw new Error(`Липсва или е невалидно полето ${fieldName}.`);
}

export function parseContentDocument(content: string): ParsedContentDocument {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  if (!normalized.includes(documentSignature)) {
    throw new Error("Файлът не е Bansko NOW export документ.");
  }

  const rawMetadata: Record<string, string> = {};
  for (const match of normalized.matchAll(metadataPattern)) {
    rawMetadata[match[1]] = match[2].trim();
  }

  if (rawMetadata.document_type !== "article" && rawMetadata.document_type !== "page") {
    throw new Error("Липсва или е невалиден типът на документа.");
  }

  const fields: Record<string, string> = {};
  for (const match of normalized.matchAll(fieldPattern)) {
    fields[match[1]] = match[2].replace(/\n+$/g, "");
  }

  if (!Object.keys(fields).length) {
    throw new Error("Не са намерени полета. AI вероятно е променил маркерите.");
  }

  return {
    metadata: {
      documentType: rawMetadata.document_type,
      sourceLocale: readLocale(rawMetadata.source_locale, "source_locale"),
      targetLocale: readLocale(rawMetadata.target_locale, "target_locale"),
      translationGroupId: rawMetadata.translation_group_id || "",
      recordId: rawMetadata.record_id || ""
    },
    fields
  };
}

export function safeDocumentFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "content";
}
