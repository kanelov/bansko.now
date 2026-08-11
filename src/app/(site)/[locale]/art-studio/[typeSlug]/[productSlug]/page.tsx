import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtStudioOrderForm } from "@/components/public/art-studio-order-form";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProductBySlugs, getArtStudioProducts, getArtStudioPublicSettings } from "@/lib/art-studio";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale, LocalizedArtStudioProduct } from "@/lib/types";

type Params = Promise<{ locale: string; typeSlug: string; productSlug: string }>;
type SearchParams = Promise<{ order_error?: string }>;

async function getAlternateProduct(product: LocalizedArtStudioProduct, locale: Locale) {
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const products = await getArtStudioProducts({ locale: alternateLocale, productTypeId: product.product_type_id });
  return products.find((item) => item.id === product.id) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, typeSlug, productSlug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getArtStudioProductBySlugs(typeSlug, productSlug, locale);
  if (!product) return {};

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const alternate = await getAlternateProduct(product, locale);
  const path = `/art-studio/${product.product_type.slug}/${product.slug}`;
  const canonical = localeUrl(locale, path);
  const languages: Record<string, string> = { [locale]: canonical };
  if (alternate) {
    const alternatePath = `/art-studio/${alternate.product_type.slug}/${alternate.slug}`;
    languages[alternateLocale] = localeUrl(alternateLocale, alternatePath);
    languages["x-default"] = locale === "bg" ? canonical : localeUrl("bg", alternatePath);
  } else if (locale === "bg") {
    languages["x-default"] = canonical;
  }

  const title = product.seo_title || product.title;
  const description = product.seo_description || product.short_description || undefined;
  const image = product.og_image_url || product.image_url || undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title: product.og_title || title,
      description: product.og_description || description,
      images: image ? [{ url: image, alt: product.image_alt || product.title }] : undefined
    },
    twitter: { card: "summary_large_image", title: product.og_title || title, description: product.og_description || description, images: image ? [image] : undefined },
    robots: { index: product.robots_index, follow: product.robots_follow }
  };
}

export default async function ArtStudioProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ locale, typeSlug, productSlug }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const product = await getArtStudioProductBySlugs(typeSlug, productSlug, locale);
  if (!product) notFound();

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const [settings, siteSettings, alternate] = await Promise.all([
    getArtStudioPublicSettings(),
    getSiteSettings(locale),
    getAlternateProduct(product, locale)
  ]);
  const path = `/art-studio/${product.product_type.slug}/${product.slug}`;
  const productUrl = localeUrl(locale, path);
  const images = [product.image_url, ...(product.gallery_urls || [])]
    .filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index)
    .map((src, index) => ({ src, alt: index === 0 ? product.image_alt || product.title : `${product.image_alt || product.title} ${index + 1}` }));
  const activeOffers = product.offers.filter((offer) => offer.is_active);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo_description || product.short_description || product.description || undefined,
    sku: product.sku || undefined,
    image: images.map((image) => image.src),
    url: productUrl,
    inLanguage: locale,
    brand: { "@type": "Brand", name: "Bansko NOW Art Studio" },
    offers: activeOffers.map((offer) => ({
      "@type": "Offer",
      url: productUrl,
      priceCurrency: offer.currency,
      price: Number(offer.price).toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }))
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "en" ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: "Art Studio", item: localeUrl(locale, "/art-studio") },
      { "@type": "ListItem", position: 3, name: product.product_type.title, item: localeUrl(locale, `/art-studio/${product.product_type.slug}`) },
      { "@type": "ListItem", position: 4, name: product.title, item: productUrl }
    ]
  };
  const alternateHref = alternate ? localePath(alternateLocale, `/art-studio/${alternate.product_type.slug}/${alternate.slug}`) : null;

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={alternateHref} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={locale === "en" ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/art-studio")}>Art Studio</Link><span className="px-2">/</span>
          <Link href={localePath(locale, `/art-studio/${product.product_type.slug}`)}>{product.product_type.title}</Link><span className="px-2">/</span><span>{product.title}</span>
        </nav>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-12">
          <article className="min-w-0 lg:col-span-7">
            <p className="text-sm font-semibold uppercase text-moss">{product.category?.title || product.product_type.title}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{product.title}</h1>
            {product.short_description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-650">{product.short_description}</p> : null}

            {images.length ? <GalleryLightbox images={images} locale={locale} /> : <div className="mt-10 aspect-[4/3] rounded-2xl bg-sage" />}

            {product.description ? (
              <section className="mt-12 border-t border-stone-200 pt-10">
                <MarkdownRenderer content={product.description} locale={locale} />
              </section>
            ) : null}
          </article>

          <aside className="lg:sticky lg:top-24 lg:col-span-5">
            <ArtStudioOrderForm product={product} settings={settings} locale={locale} orderError={query.order_error || null} />
          </aside>
        </div>
      </main>
      <SiteFooter settings={siteSettings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
