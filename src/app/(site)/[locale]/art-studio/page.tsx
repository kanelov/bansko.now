import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { ArtStudioServiceCard } from "@/components/public/art-studio-service-card";
import { ArtStudioProductTypeCard } from "@/components/public/art-studio-product-type-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProductTypes } from "@/lib/art-studio";
import { getArtStudioServices, getEditablePageBySlug, getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getEditablePageBySlug("art-studio", { locale });

  return {
    title: { absolute: page?.seo_title || page?.title || "Art Studio | Bansko NOW" },
    description: page?.seo_description || page?.excerpt || "Art Studio услуги към Bansko NOW.",
    alternates: {
      canonical: page?.canonical_url || localeUrl(locale, "/art-studio"),
      languages: { bg: localeUrl("bg", "/art-studio"), en: localeUrl("en", "/art-studio"), "x-default": localeUrl("bg", "/art-studio") }
    },
    openGraph: {
      title: page?.og_title || page?.seo_title || page?.title || "Art Studio",
      description: page?.og_description || page?.seo_description || page?.excerpt || undefined,
      images: page?.og_image_url || page?.hero_image_url ? [page.og_image_url || page.hero_image_url || ""] : undefined,
      type: "website"
    },
    robots: {
      index: page?.robots_index ?? true,
      follow: page?.robots_follow ?? true
    }
  };
}

export default async function ArtStudioPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [settings, page, services, productTypes] = await Promise.all([
    getSiteSettings(locale),
    getEditablePageBySlug("art-studio", { locale }),
    getArtStudioServices({ locale }),
    getArtStudioProductTypes({ locale })
  ]);
  const premium = services.find((service) => service.is_premium) ?? services[0] ?? null;
  const regularServices = services.filter((service) => service.id !== premium?.id);
  const heroImage =
    page?.hero_image_url ||
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=80";
  const ctaUrl = page?.cta_url || localePath(locale, "/contact");
  const isExternalCta = /^https?:\/\//i.test(ctaUrl);
  const schema = {
    "@context": "https://schema.org",
    "@type": page?.schema_type || "Service",
    name: page?.title || "Art Studio към Bansko NOW",
    description: page?.excerpt,
    url: localeUrl(locale, "/art-studio"),
    inLanguage: locale === "en" ? "en" : "bg",
    image: heroImage,
    provider: {
      "@type": "Organization",
      name: "Bansko NOW"
    },
    hasOfferCatalog: services.length
      ? {
          "@type": "OfferCatalog",
          name: locale === "en" ? "Art Studio services" : "Art Studio услуги",
          itemListElement: services.map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service.title,
              description: service.description
            }
          }))
        }
      : undefined
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio")} />
      <main>
        <section className="relative min-h-[64vh] overflow-hidden bg-forest text-white">
          <img src={heroImage} alt={page?.hero_image_alt || page?.title || "Art Studio"} className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/70" />
          <div className="relative mx-auto flex min-h-[64vh] max-w-7xl flex-col justify-end px-4 pb-14 pt-28 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase">{page?.eyebrow || "Art Studio към Bansko NOW"}</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-tight sm:text-7xl">
              {page?.title || "Визуални истории от Банско"}
            </h1>
            {page?.excerpt ? <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100">{page.excerpt}</p> : null}
            {page?.cta_label ? (
              <div className="mt-8">
                {isExternalCta ? (
                  <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100">
                    {page.cta_label}
                  </a>
                ) : (
                  <Link href={localePath(locale, ctaUrl) as Route} className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100">
                    {page.cta_label}
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:px-8">
          {page?.content ? (
            <section className="mx-auto max-w-4xl">
              <MarkdownRenderer content={page.content} locale={locale} />
            </section>
          ) : null}

          {productTypes.length ? (
            <section aria-labelledby="art-studio-products-heading">
              <div className="mb-8 max-w-3xl">
                <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "Art products" : "Арт продукти"}</p>
                <h2 id="art-studio-products-heading" className="mt-3 font-serif text-4xl font-semibold text-stone-950">
                  {locale === "en" ? "Choose what you want to create" : "Избери какво искаш да създадем"}
                </h2>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {productTypes.map((productType) => (
                  <ArtStudioProductTypeCard key={productType.id} productType={productType} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "Services" : "Услуги"}</p>
                <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">{locale === "en" ? "Choose a visual service" : "Избери визуална услуга"}</h2>
              </div>
              <Link href={localePath(locale, "/contact") as Route} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
                {locale === "en" ? "Custom enquiry" : "Индивидуална заявка"}
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

          <FacebookGroupCTA settings={settings} locale={locale} />
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
