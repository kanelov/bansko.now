import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArtStudioProductTypeCard } from "@/components/public/art-studio-product-type-card";
import { ArtStudioServiceCard } from "@/components/public/art-studio-service-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { IconGlyph } from "@/components/public/icon-glyph";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { resolveArtStudioLandingCopy, resolveArtStudioLandingLinks, resolveArtStudioLandingSections } from "@/lib/art-studio-copy";
import { getFaqItemsFromMarkdown } from "@/lib/markdown-blocks";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProducts, getArtStudioProductTypes, getArtStudioPublicSettings } from "@/lib/art-studio";
import { getArtStudioServices, getEditablePageBySlug, getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import { getLocalizedGalleryCategories } from "@/lib/gallery-catalog";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string }>;

// Cached and refreshed every 15 minutes (the gallery feed itself is cached for the same time).
export const revalidate = 900;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [page, settings, pickupSettings] = await Promise.all([getEditablePageBySlug("art-studio", { locale }), getSiteSettings(locale), getArtStudioPublicSettings()]);
  const text = resolveArtStudioLandingCopy(pickupSettings.page_copy, locale);
  const title = page?.seo_title || `${page?.title || text.title} | Bansko NOW`;
  const description = page?.seo_description || text.metaDescription;
  const image = page?.og_image_url || page?.hero_image_url || settings.default_og_image || settings.hero_image_url || undefined;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: page?.canonical_url || localeUrl(locale, "/art-studio"),
      languages: { bg: localeUrl("bg", "/art-studio"), en: localeUrl("en", "/art-studio"), "x-default": localeUrl("bg", "/art-studio") }
    },
    openGraph: {
      title: page?.og_title || page?.seo_title || page?.title || text.title,
      description: page?.og_description || description,
      images: image ? [image] : undefined,
      type: "website",
      url: localeUrl(locale, "/art-studio")
    },
    robots: {
      index: page?.robots_index ?? true,
      follow: page?.robots_follow ?? true
    }
  };
}

function pickupName(locale: Locale, settings: Awaited<ReturnType<typeof getArtStudioPublicSettings>>) {
  return (locale === "en" ? settings.pickup_name_en : settings.pickup_name_bg) || "Art Gallery Bansko";
}

export default async function ArtStudioPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [settings, page, services, productTypes, products, galleryCategories, pickupSettings] = await Promise.all([
    getSiteSettings(locale),
    getEditablePageBySlug("art-studio", { locale }),
    getArtStudioServices({ locale }),
    getArtStudioProductTypes({ locale }),
    getArtStudioProducts({ locale }),
    getLocalizedGalleryCategories(locale).catch(() => []),
    getArtStudioPublicSettings()
  ]);
  const text = resolveArtStudioLandingCopy(pickupSettings.page_copy, locale);
  const sections = resolveArtStudioLandingSections(pickupSettings.page_copy);
  const links = resolveArtStudioLandingLinks(pickupSettings.page_copy);
  const typeImages = new Map<string, string>();
  for (const product of products) {
    if (product.image_url && !typeImages.has(product.product_type_id)) typeImages.set(product.product_type_id, product.image_url);
  }
  const premium = services.find((service) => service.is_premium) ?? services[0] ?? null;
  const regularServices = services.filter((service) => service.id !== premium?.id);
  const collections = galleryCategories
    .filter((category) => !category.parent_id && category.product_count > 0)
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 6);
  const heroImage = page?.hero_image_url || settings.hero_image_url || settings.default_og_image || null;
  const heroTitle = page?.title || text.title;
  const heroLead = page?.excerpt || text.lead;
  const pageUrl = localeUrl(locale, "/art-studio");
  const galleryHref = (/^https:\/\//i.test(links.gallery) ? links.gallery : localePath(locale, links.gallery)) as Route;
  const customTarget = links.custom || (page?.cta_url && !/^https?:\/\//i.test(page.cta_url) ? page.cta_url : "/contact");
  const contactHref = (/^https:\/\//i.test(customTarget) ? customTarget : localePath(locale, customTarget)) as Route;
  const studioName = pickupName(locale, pickupSettings);
  const address = locale === "en" ? pickupSettings.pickup_address_en : pickupSettings.pickup_address_bg;

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${pageUrl}#store`,
    name: studioName,
    alternateName: "Art Studio Bansko",
    url: pageUrl,
    image: heroImage || undefined,
    description: page?.seo_description || text.metaDescription,
    telephone: pickupSettings.pickup_phone || undefined,
    address: address
      ? { "@type": "PostalAddress", streetAddress: address, addressLocality: "Bansko", addressCountry: "BG" }
      : { "@type": "PostalAddress", addressLocality: "Bansko", addressCountry: "BG" },
    areaServed: ["Bansko", "Bulgaria"],
    parentOrganization: { "@id": `${siteUrl}/#organization` },
    hasOfferCatalog: productTypes.length
      ? {
          "@type": "OfferCatalog",
          name: text.productsTitle,
          itemListElement: productTypes.map((productType) => ({
            "@type": "OfferCatalog",
            name: productType.title,
            url: localeUrl(locale, `/art-studio/${productType.slug}`)
          }))
        }
      : undefined
  };
  const cmsFaq = page?.content ? getFaqItemsFromMarkdown(page.content) : [];
  const faqItems = cmsFaq.length ? cmsFaq : text.faq;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/[*_`#>]/g, "").trim() }
    }))
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: text.breadcrumbHome, item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: heroTitle, item: pageUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio")} />
      <main>
        <section className="mx-auto max-w-7xl px-4 pb-4 pt-24 sm:px-6 lg:px-8">
          <nav className="text-sm text-stone-500" aria-label={dictionary.navigation}>
            <Link href={localePath(locale, "/") as Route} className="hover:text-forest">{text.breadcrumbHome}</Link>
            <span className="px-2">/</span>
            <span className="text-stone-700">{page?.eyebrow || text.eyebrow}</span>
          </nav>
          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-semibold uppercase text-moss">{page?.eyebrow || text.eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-stone-950 sm:text-6xl">{heroTitle}</h1>
            <p className="mt-5 text-lg leading-8 text-stone-650">{heroLead}</p>
          </div>
          {productTypes.length ? (
            <div id="art-studio-products" className={`mt-10 grid gap-5 sm:grid-cols-2 ${productTypes.length === 4 || productTypes.length === 8 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {productTypes.map((productType, index) => (
                <ArtStudioProductTypeCard
                  key={productType.id}
                  productType={productType}
                  locale={locale}
                  priority={index < 2}
                  imageUrl={typeImages.get(productType.id) ?? null}
                />
              ))}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={galleryHref} className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
              {text.ctaGallery}
            </Link>
            <Link href={contactHref} className="inline-flex rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
              {page?.cta_label || text.customButton}
            </Link>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-16 sm:px-6 lg:px-8">
          {sections.trust ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={text.eyebrow}>
            {text.trust.map((item) => (
              <div key={item.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-sage text-forest">
                  <IconGlyph name={item.icon} className="h-4 w-4" />
                </span>
                <h2 className="mt-4 font-serif text-xl font-semibold text-stone-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
              </div>
            ))}
          </section>
          ) : null}

          {page?.content ? (
            <section className="mx-auto w-full max-w-4xl">
              <MarkdownRenderer content={page.content} locale={locale} />
            </section>
          ) : null}

          {sections.collections && collections.length ? (
            <section aria-labelledby="art-studio-collections-heading">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase text-moss">{text.collectionsEyebrow}</p>
                  <h2 id="art-studio-collections-heading" className="mt-3 font-serif text-4xl font-semibold text-stone-950">{text.collectionsTitle}</h2>
                  <p className="mt-4 text-base leading-7 text-stone-650">{text.collectionsText}</p>
                </div>
                <Link href={galleryHref} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
                  {text.collectionsButton}
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((category) => (
                  <Link
                    key={category.id}
                    href={localePath(locale, `/art-studio/gallery/category/${category.slug}`) as Route}
                    className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-sage">
                      {category.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- source gallery images are served directly on purpose
                        <img
                          src={category.image_url}
                          alt={category.image_alt || category.name}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif text-2xl font-semibold text-stone-950">{category.name}</h3>
                      <p className="mt-2 text-sm text-stone-500">
                        {locale === "en" ? `${category.product_count} products` : `${category.product_count} продукта`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {sections.services && services.length ? (
            <section aria-labelledby="art-studio-services-heading">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold uppercase text-moss">{text.servicesEyebrow}</p>
                  <h2 id="art-studio-services-heading" className="mt-3 font-serif text-4xl font-semibold text-stone-950">{text.servicesTitle}</h2>
                </div>
                <Link href={contactHref} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
                  {text.servicesButton}
                </Link>
              </div>
              {premium ? <ArtStudioServiceCard service={premium} featured locale={locale} /> : null}
              {regularServices.length ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {regularServices.map((service) => (
                    <ArtStudioServiceCard key={service.id} service={service} locale={locale} />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {sections.steps ? (
          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-soft sm:p-10" aria-labelledby="art-studio-steps-heading">
            <p className="text-sm font-semibold uppercase text-moss">{text.stepsEyebrow}</p>
            <h2 id="art-studio-steps-heading" className="mt-3 font-serif text-4xl font-semibold text-stone-950">{text.stepsTitle}</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {text.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-paper p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-forest font-serif text-lg font-semibold text-white">{index + 1}</span>
                  <h3 className="mt-4 font-serif text-2xl font-semibold text-stone-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
          ) : null}

          {sections.custom ? (
          <section className="grid gap-8 rounded-3xl bg-[#f7f2e8] p-8 shadow-soft sm:p-10 md:grid-cols-[1.2fr_0.8fr] md:items-center" aria-labelledby="art-studio-custom-heading">
            <div>
              <p className="text-sm font-semibold uppercase text-moss">{text.customEyebrow}</p>
              <h2 id="art-studio-custom-heading" className="mt-3 font-serif text-4xl font-semibold text-stone-950">{text.customTitle}</h2>
              <p className="mt-4 text-base leading-7 text-stone-650">{text.customText}</p>
            </div>
            <div className="flex md:justify-end">
              <Link href={contactHref} className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
                {page?.cta_label || text.customButton}
              </Link>
            </div>
          </section>
          ) : null}

          {sections.faq && !cmsFaq.length ? (
            <section aria-labelledby="art-studio-faq-heading" className="mx-auto w-full max-w-4xl">
              <p className="text-sm font-semibold uppercase text-moss">{text.faqEyebrow}</p>
              <h2 id="art-studio-faq-heading" className="mt-3 font-serif text-4xl font-semibold text-stone-950">{text.faqTitle}</h2>
              <div className="mt-8 grid gap-3">
                {faqItems.map((item) => (
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

          {sections.facebook ? <FacebookGroupCTA settings={settings} locale={locale} /> : null}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }} />
      {sections.faq || cmsFaq.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
