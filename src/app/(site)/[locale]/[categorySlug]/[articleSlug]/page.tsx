import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtStudioNativeBlock } from "@/components/public/art-studio-native-block";
import { ArticleCard } from "@/components/public/article-card";
import { ArticleShareActions } from "@/components/public/article-share-actions";
import { ArticleTableOfContents } from "@/components/public/article-table-of-contents";
import { BanskoCollectionBlock } from "@/components/public/bansko-collection-block";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { ScrollToTopButton } from "@/components/public/scroll-to-top-button";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { SourceLinks } from "@/components/public/source-links";
import {
  fallbackHeroImage,
  getArticleBySlug,
  getArticleCategory,
  getArticlePath,
  getPublishedArticleTranslation,
  getRelatedArticles,
  getSiteSettings,
  getTagsForArticle
} from "@/lib/content";
import { siteUrl } from "@/lib/env";
import { getArticleToc, getFaqItemsFromMarkdown } from "@/lib/markdown-blocks";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; categorySlug: string; articleSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, articleSlug } = await params;
  if (!isLocale(locale)) return {};
  const article = await getArticleBySlug(articleSlug, locale);

  if (!article) {
    return {};
  }

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || undefined;
  const image = article.og_image_url || article.featured_image_url || fallbackHeroImage;
  const canonical = article.canonical_url || `${siteUrl}${getArticlePath(article)}`;
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const translation = await getPublishedArticleTranslation(article.translation_group_id, alternateLocale);
  const languages: Record<string, string> = {
    [locale]: canonical
  };

  if (translation) {
    languages[alternateLocale] = localeUrl(alternateLocale, getArticlePath(translation));
    languages["x-default"] = locale === "bg" ? canonical : localeUrl("bg", getArticlePath(translation));
  } else if (locale === "bg") {
    languages["x-default"] = canonical;
  }

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical,
      languages
    },
    robots: {
      index: article.robots_index,
      follow: article.robots_follow
    },
    openGraph: {
      title: article.og_title || title,
      description: article.og_description || description,
      type: "article",
      url: canonical,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
      authors: [article.author_name || "Любо Канелов"],
      images: image ? [{ url: image, alt: article.featured_image_alt || article.title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: article.og_title || title,
      description: article.og_description || description,
      images: image ? [image] : undefined
    }
  };
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function stripMarkdownForSchema(value: string) {
  return value
    .replace(/:::([a-z]+)\n([\s\S]*?)\n:::/g, "$2")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value: string) {
  const text = stripMarkdownForSchema(value);

  if (!text) {
    return 0;
  }

  return text.split(/\s+/).length;
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { locale, categorySlug, articleSlug } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [article, settings] = await Promise.all([getArticleBySlug(articleSlug, locale), getSiteSettings(locale)]);

  if (!article) {
    notFound();
  }

  const category = getArticleCategory(article);

  if (!category || category.slug !== categorySlug) {
    notFound();
  }

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const [related, tags, translation] = await Promise.all([
    getRelatedArticles(article),
    getTagsForArticle(article.id),
    getPublishedArticleTranslation(article.translation_group_id, alternateLocale)
  ]);
  const image = article.featured_image_url || fallbackHeroImage;
  const articleUrl = `${siteUrl}${getArticlePath(article)}`;
  const publishedDate = formatDate(article.published_at, locale);
  const updatedDate = formatDate(article.updated_at, locale);
  const tocItems = getArticleToc(article.content);
  const articleWordCount = wordCount(article.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": article.schema_type || "Article",
    url: articleUrl,
    headline: article.title,
    description: article.seo_description || article.excerpt,
    image: [
      {
        "@type": "ImageObject",
        url: image,
        caption: article.featured_image_alt || article.title,
        representativeOfPage: true
      }
    ],
    thumbnailUrl: image,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    inLanguage: locale === "en" ? "en" : "bg",
    isAccessibleForFree: true,
    wordCount: articleWordCount || undefined,
    author: {
      "@type": "Person",
      name: article.author_name || settings.default_author_name || "Любо Канелов"
    },
    publisher: {
      "@type": "Organization",
      name: "Bansko NOW",
      url: siteUrl
    },
    articleSection: category.name,
    about: {
      "@type": "Thing",
      name: category.name
    },
    keywords: tags.map((tag) => tag.name).join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl
    }
  };
  const faqItems = getFaqItemsFromMarkdown(article.content);
  const faqSchema = faqItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: stripMarkdownForSchema(item.answer)
          }
        }))
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dictionary.home, item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: category.name, item: localeUrl(locale, `/${category.slug}`) },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={translation ? getArticlePath(translation) : null} />
      <main>
        <article className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
          <nav className="text-sm text-stone-500">
            <Link href={localePath(locale, "/")}>{dictionary.home}</Link>
            <span className="px-2">/</span>
            <Link href={localePath(locale, `/${category.slug}`)}>{category.name}</Link>
          </nav>

          <header className="mt-10">
            <Link href={localePath(locale, `/${category.slug}`)} className="text-sm font-semibold uppercase text-moss">
              {category.name}
            </Link>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">
              {article.title}
            </h1>
            {article.excerpt ? <p className="mt-6 text-xl leading-9 text-stone-650">{article.excerpt}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-500">
              {publishedDate ? <span>{dictionary.publishedOn} {publishedDate}</span> : null}
              {updatedDate && updatedDate !== publishedDate ? <span>{dictionary.updatedOn} {updatedDate}</span> : null}
              <span>{article.author_name || settings.default_author_name || "Любо Канелов"}</span>
              <span>{article.reading_time || 1} {dictionary.readingTime}</span>
            </div>
            <ArticleShareActions title={article.title} url={articleUrl} locale={locale} />
          </header>

          <figure className="mt-10">
            <img
              src={image}
              alt={article.featured_image_alt || article.title}
              className="aspect-[16/10] w-full rounded-3xl object-cover"
              decoding="async"
            />
            {article.featured_image_alt ? (
              <figcaption className="mt-3 text-sm text-stone-500">{article.featured_image_alt}</figcaption>
            ) : null}
          </figure>

          <div className="mt-12">
            <ArticleTableOfContents items={tocItems} locale={locale} />
            <MarkdownRenderer content={article.content} locale={locale} />
            <SourceLinks links={article.source_links} locale={locale} />
          </div>

          <div className="mt-14 grid gap-8">
            {article.show_art_studio_block ? <ArtStudioNativeBlock locale={locale} settings={settings} /> : null}
            {article.show_bansko_collection_block ? <BanskoCollectionBlock locale={locale} settings={settings} /> : null}
            {article.show_facebook_cta ? <FacebookGroupCTA settings={settings} locale={locale} /> : null}
          </div>
        </article>

        {related.length ? (
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-semibold text-stone-950">{dictionary.relatedArticles}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      <ScrollToTopButton locale={locale} />
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
