import type { ArticleWithCategory } from "@/lib/types";

export type SeoChecklistItem = {
  label: string;
  passed: boolean;
};

function text(value?: string | null) {
  return (value || "").trim();
}

function jsonArrayLength(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean).length : 0;
}

export function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function getWordCount(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function getSeoChecklist(article: Partial<ArticleWithCategory>): SeoChecklistItem[] {
  const focusKeyword = text(article.focus_keyword).toLowerCase();
  const seoTitle = text(article.seo_title || article.title);
  const seoDescription = text(article.seo_description || article.excerpt);
  const slug = text(article.slug);
  const content = text(article.content);
  const firstParagraph =
    content
      .split(/\n{2,}/)
      .find((block) => block.trim() && !block.trim().startsWith("#"))
      ?.toLowerCase() || "";
  const bodyH1Count = (content.match(/^#\s+/gm) || []).length;
  const hasHeadings = /^#{2,3}\s+/m.test(content);

  return [
    { label: "Фокус ключова дума", passed: Boolean(focusKeyword) },
    { label: "SEO заглавие", passed: Boolean(seoTitle) },
    { label: "SEO заглавие до 60 знака", passed: seoTitle.length > 0 && seoTitle.length <= 60 },
    {
      label: "SEO заглавието съдържа ключовата дума",
      passed: Boolean(focusKeyword && seoTitle.toLowerCase().includes(focusKeyword))
    },
    { label: "Meta описание", passed: Boolean(seoDescription) },
    {
      label: "Meta описание до 160 знака",
      passed: seoDescription.length > 0 && seoDescription.length <= 160
    },
    {
      label: "Meta описанието съдържа ключовата дума",
      passed: Boolean(focusKeyword && seoDescription.toLowerCase().includes(focusKeyword))
    },
    { label: "Кратък slug", passed: Boolean(slug && slug.length <= 70 && slug.split("-").length <= 8) },
    {
      label: "Ключовата дума е в първия параграф",
      passed: Boolean(focusKeyword && firstParagraph.includes(focusKeyword))
    },
    { label: "Само един H1 на страницата", passed: bodyH1Count === 0 },
    { label: "Има H2/H3 подзаглавия", passed: hasHeadings },
    {
      label: "Има вътрешна връзка или предложение",
      passed:
        jsonArrayLength(article.internal_link_suggestions) > 0 ||
        /\]\(\/[a-z0-9-/]+\)/i.test(content)
    },
    {
      label: "Има външен източник",
      passed: jsonArrayLength(article.source_links) > 0 || /https?:\/\//i.test(content)
    },
    { label: "Има основна снимка", passed: Boolean(article.featured_image_url) },
    { label: "Има alt текст за снимката", passed: Boolean(article.featured_image_alt) },
    { label: "Текстът е поне 700 думи", passed: getWordCount(content) >= 700 },
    { label: "Избрана е категория", passed: Boolean(article.category_id || article.category || article.categories) },
    { label: "Има OpenGraph изображение", passed: Boolean(article.og_image_url || article.featured_image_url) },
    { label: "Страницата е indexable", passed: article.robots_index !== false }
  ];
}

export function getSeoScore(article: Partial<ArticleWithCategory>) {
  const items = getSeoChecklist(article);
  const passed = items.filter((item) => item.passed).length;
  return Math.round((passed / items.length) * 100);
}
