import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArtStudioEnquiryForm } from "@/components/public/art-studio-enquiry-form";
import { ArtStudioProductCard } from "@/components/public/art-studio-product-card";
import { ArtStudioThumbnailStrip, type ThumbnailImage } from "@/components/public/art-studio-thumbnail-strip";
import { IconGlyph } from "@/components/public/icon-glyph";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProducts, getArtStudioProductTypes, getArtStudioPublicSettings, getArtStudioTypeBySlug } from "@/lib/art-studio";
import { resolveArtStudioTypeCopy } from "@/lib/art-studio-copy";
import { normalizeFormConfig, sourceGroupsForConfig } from "@/lib/art-studio-forms";
import { getSourceVariantOptions } from "@/lib/gallery-catalog";
import { getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import { getFaqItemsFromMarkdown } from "@/lib/markdown-blocks";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; typeSlug: string }>;

// Product type pages are selling landing pages: cached, refreshed every 15 minutes.
export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return [];
  const types = await getArtStudioProductTypes({ locale: params.locale });
  return types.map((productType) => ({ typeSlug: productType.slug }));
}

async function getAlternateType(id: string, locale: Locale) {
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const types = await getArtStudioProductTypes({ locale: alternateLocale });
  return types.find((item) => item.id === id) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, typeSlug } = await params;
  if (!isLocale(locale)) return {};
  const productType = await getArtStudioTypeBySlug(typeSlug, locale);
  if (!productType) return {};

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const alternate = await getAlternateType(productType.id, locale);
  const canonical = localeUrl(locale, `/art-studio/${productType.slug}`);
  const languages: Record<string, string> = { [locale]: canonical };
  if (alternate) {
    languages[alternateLocale] = localeUrl(alternateLocale, `/art-studio/${alternate.slug}`);
    languages["x-default"] = locale === "bg" ? canonical : localeUrl("bg", `/art-studio/${alternate.slug}`);
  } else if (locale === "bg") {
    languages["x-default"] = canonical;
  }

  const pickupSettings = await getArtStudioPublicSettings();
  const copy = resolveArtStudioTypeCopy(pickupSettings.page_copy, productType.internal_name, locale);
  const title = productType.seo_title || `${productType.title} | Art Studio Bansko`;
  const description = productType.seo_description || productType.description || copy.lead;
  const image = productType.og_image_url || productType.image_url || undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title: productType.og_title || title,
      description: productType.og_description || description,
      images: image ? [{ url: image, alt: productType.image_alt || productType.title }] : undefined
    },
    twitter: { card: "summary_large_image", title: productType.og_title || title, description: productType.og_description || description, images: image ? [image] : undefined },
    robots: { index: productType.robots_index, follow: productType.robots_follow }
  };
}

export default async function ArtStudioTypePage({ params }: { params: Params }) {
  const { locale, typeSlug } = await params;
  if (!isLocale(locale)) notFound();
  const productType = await getArtStudioTypeBySlug(typeSlug, locale);
  if (!productType) notFound();

  const isEnglish = locale === "en";
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const [products, settings, pickupSettings, alternate, sourceOptions] = await Promise.all([
    getArtStudioProducts({ locale, productTypeId: productType.id }),
    getSiteSettings(locale),
    getArtStudioPublicSettings(),
    getAlternateType(productType.id, locale),
    getSourceVariantOptions()
  ]);
  const copy = resolveArtStudioTypeCopy(pickupSettings.page_copy, productType.internal_name, locale);
  const thumbnails: ThumbnailImage[] = [
    ...(productType.gallery_urls ?? []).map((src) => ({ src, alt: productType.image_alt || productType.title })),
    ...products.flatMap((product) =>
      [product.image_url, ...(product.gallery_urls || [])]
        .filter((src): src is string => Boolean(src))
        .map((src) => ({ src, alt: product.image_alt || product.title, href: localePath(locale, `/art-studio/${productType.slug}/${product.slug}`) }))
    )
  ]
    .filter((image, index, all) => all.findIndex((other) => other.src === image.src) === index)
    .slice(0, 12);
  const sourceGroups = sourceGroupsForConfig(normalizeFormConfig(productType.form_config), sourceOptions);
  const featuredProducts = products.slice(0, 4);
  const designsHref = localePath(locale, `/art-studio/${productType.slug}/designs`) as Route;
  const content = productType.content?.trim() || "";
  const contentFaq = content ? getFaqItemsFromMarkdown(content) : [];
  const faq = contentFaq.length ? contentFaq : copy.faq;
  const heroImage = productType.image_url || products.find((product) => product.image_url)?.image_url || null;
  const pageUrl = localeUrl(locale, `/art-studio/${productType.slug}`);
  const prices = products.flatMap((product) => product.offers.filter((offer) => offer.is_active).map((offer) => Number(offer.price)));
  const currency = products.flatMap((product) => product.offers)[0]?.currency || "EUR";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productType.title,
    description: productType.seo_description || productType.description || copy.lead,
    image: heroImage ? [heroImage] : undefined,
    url: pageUrl,
    brand: { "@type": "Brand", name: "Art Studio Bansko" },
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: currency,
            lowPrice: Math.min(...prices).toFixed(2),
            highPrice: Math.max(...prices).toFixed(2),
            offerCount: prices.length,
            availability: "https://schema.org/InStock",
            url: pageUrl
          }
        }
      : {})
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/[*_`#>]/g, "").trim() }
    }))
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEnglish ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: "Art Studio", item: localeUrl(locale, "/art-studio") },
      { "@type": "ListItem", position: 3, name: productType.title, item: pageUrl }
    ]
  };
  const designsSchema = products.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${productType.title}: ${isEnglish ? "designs" : "дизайни"}`,
        itemListElement: featuredProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.title,
          url: localeUrl(locale, `/art-studio/${productType.slug}/${product.slug}`)
        }))
      }
    : null;

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={alternate ? localePath(alternateLocale, `/art-studio/${alternate.slug}`) : null} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={isEnglish ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/") as Route}>{isEnglish ? "Home" : "Начало"}</Link>
          <span className="px-2">/</span>
          <Link href={localePath(locale, "/art-studio") as Route}>Art Studio</Link>
          <span className="px-2">/</span>
          <span className="text-stone-700">{productType.title}</span>
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-12">
          <article className="min-w-0 lg:col-span-7">
            <p className="text-sm font-semibold uppercase text-moss">{copy.eyebrow}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{productType.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-650">{productType.description || copy.lead}</p>
            <div className="mt-6 flex flex-wrap gap-3 lg:hidden">
              <a href="#order" className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
                {copy.cta}
              </a>
            </div>

            {heroImage ? (
              <figure className="mt-10 overflow-hidden rounded-3xl bg-sage">
                {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic */}
                <img
                  src={heroImage}
                  alt={productType.image_alt || productType.title}
                  width={1200}
                  height={900}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </figure>
            ) : null}

            <ArtStudioThumbnailStrip images={thumbnails} locale={locale} />

            <section className="mt-10 grid gap-4 sm:grid-cols-2" aria-label={isEnglish ? "Why order from us" : "Защо да поръчаш от нас"}>
              {copy.benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-forest">
                    <IconGlyph name="check" className="h-4 w-4" />
                  </span>
                  <h2 className="mt-3 font-serif text-xl font-semibold text-stone-950">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{benefit.text}</p>
                </div>
              ))}
            </section>

            {content ? (
              <section className="mt-12 border-t border-stone-200 pt-10">
                <MarkdownRenderer content={content} locale={locale} />
              </section>
            ) : copy.intro.length ? (
              <section className="mt-12 grid gap-5 border-t border-stone-200 pt-10" aria-label={isEnglish ? "About this product" : "За продукта"}>
                {copy.intro.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="max-w-3xl text-base leading-8 text-stone-650">{paragraph}</p>
                ))}
              </section>
            ) : null}

            {products.length ? (
              <section id="designs" className="mt-12 border-t border-stone-200 pt-10" aria-labelledby="designs-heading">
                <h2 id="designs-heading" className="font-serif text-4xl font-semibold text-stone-950">{isEnglish ? "Ready designs" : "Готови дизайни"}</h2>
                <p className="mt-3 max-w-2xl leading-7 text-stone-650">
                  {isEnglish ? "Pick a ready design or order a custom one through the form." : "Избери готов дизайн или поръчай собствен през формата."}
                </p>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  {featuredProducts.map((product) => (
                    <ArtStudioProductCard key={product.id} product={product} locale={locale} />
                  ))}
                </div>
                {products.length > featuredProducts.length ? (
                  <div className="mt-7">
                    <Link href={designsHref} className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
                      {isEnglish ? `See all designs (${products.length})` : `Виж още готови дизайни (${products.length})`}
                      <IconGlyph name="arrow-right" className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!contentFaq.length ? (
              <section className="mt-12 border-t border-stone-200 pt-10" aria-labelledby="type-faq-heading">
                <h2 id="type-faq-heading" className="font-serif text-4xl font-semibold text-stone-950">{isEnglish ? "Frequently asked questions" : "Често задавани въпроси"}</h2>
                <div className="mt-6 grid gap-3">
                  {faq.map((item) => (
                    <details key={item.question} className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl font-semibold text-stone-950 [&::-webkit-details-marker]:hidden">
                        <span>{item.question}</span>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage text-forest transition group-open:rotate-180" aria-hidden="true">
                          <IconGlyph name="chevron-down" className="h-4 w-4" />
                        </span>
                      </summary>
                      <p className="mt-3 text-base leading-7 text-stone-650">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="lg:sticky lg:top-24 lg:col-span-5">
            <ArtStudioEnquiryForm productType={productType} settings={pickupSettings} locale={locale} sourceGroups={sourceGroups} />
          </aside>
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {designsSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(designsSchema) }} /> : null}
    </div>
  );
}
