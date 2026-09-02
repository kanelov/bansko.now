import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArtStudioProductCard } from "@/components/public/art-studio-product-card";
import { IconGlyph } from "@/components/public/icon-glyph";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProducts, getArtStudioProductTypes, getArtStudioTypeBySlug } from "@/lib/art-studio";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; typeSlug: string }>;

// All ready designs of a product type. Cached like the type page.
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

function heading(locale: Locale) {
  return locale === "en" ? "All designs" : "Готови дизайни";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, typeSlug } = await params;
  if (!isLocale(locale)) return {};
  const productType = await getArtStudioTypeBySlug(typeSlug, locale);
  if (!productType) return {};

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const alternate = await getAlternateType(productType.id, locale);
  const canonical = localeUrl(locale, `/art-studio/${productType.slug}/designs`);
  const languages: Record<string, string> = { [locale]: canonical };
  if (alternate) {
    languages[alternateLocale] = localeUrl(alternateLocale, `/art-studio/${alternate.slug}/designs`);
    languages["x-default"] = locale === "bg" ? canonical : localeUrl("bg", `/art-studio/${alternate.slug}/designs`);
  } else if (locale === "bg") {
    languages["x-default"] = canonical;
  }

  const title = `${heading(locale)}: ${productType.title} | Art Studio Bansko`;
  const description = locale === "en"
    ? `All ready ${productType.title.toLowerCase()} designs from Art Studio Bansko. Pick one and order through the form, or ask for a custom design.`
    : `Всички готови дизайни за ${productType.title.toLowerCase()} от Art Studio Банско. Избери дизайн и поръчай през формата или поискай собствен.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    openGraph: { type: "website", url: canonical, title, description, images: productType.image_url ? [{ url: productType.image_url, alt: productType.image_alt || productType.title }] : undefined },
    robots: { index: productType.robots_index, follow: productType.robots_follow }
  };
}

export default async function ArtStudioDesignsPage({ params }: { params: Params }) {
  const { locale, typeSlug } = await params;
  if (!isLocale(locale)) notFound();
  const productType = await getArtStudioTypeBySlug(typeSlug, locale);
  if (!productType) notFound();

  const isEnglish = locale === "en";
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const [products, settings, alternate] = await Promise.all([
    getArtStudioProducts({ locale, productTypeId: productType.id }),
    getSiteSettings(locale),
    getAlternateType(productType.id, locale)
  ]);
  const typeHref = localePath(locale, `/art-studio/${productType.slug}`) as Route;
  const pageUrl = localeUrl(locale, `/art-studio/${productType.slug}/designs`);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEnglish ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: "Art Studio", item: localeUrl(locale, "/art-studio") },
      { "@type": "ListItem", position: 3, name: productType.title, item: localeUrl(locale, `/art-studio/${productType.slug}`) },
      { "@type": "ListItem", position: 4, name: heading(locale), item: pageUrl }
    ]
  };
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${productType.title}: ${heading(locale)}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: localeUrl(locale, `/art-studio/${productType.slug}/${product.slug}`)
    }))
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={alternate ? localePath(alternateLocale, `/art-studio/${alternate.slug}/designs`) : null} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={isEnglish ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/") as Route}>{isEnglish ? "Home" : "Начало"}</Link>
          <span className="px-2">/</span>
          <Link href={localePath(locale, "/art-studio") as Route}>Art Studio</Link>
          <span className="px-2">/</span>
          <Link href={typeHref}>{productType.title}</Link>
          <span className="px-2">/</span>
          <span className="text-stone-700">{heading(locale)}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase text-moss">{productType.title}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{heading(locale)}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-650">
            {isEnglish
              ? "Every ready design in this collection. Open one to order it, or go back and order a custom design through the form."
              : "Всички готови дизайни в тази колекция. Отвори дизайн, за да го поръчаш, или се върни и поръчай собствен през формата."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={typeHref} className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
              <IconGlyph name="pen-nib" className="h-4 w-4" />
              {isEnglish ? "Order a custom design" : "Поръчай собствен дизайн"}
            </Link>
          </div>
        </header>

        {products.length ? (
          <section className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label={heading(locale)}>
            {products.map((product) => (
              <ArtStudioProductCard key={product.id} product={product} locale={locale} />
            ))}
          </section>
        ) : (
          <p className="mt-12 rounded-2xl border border-stone-200 bg-white p-6 text-stone-650">
            {isEnglish ? "No ready designs yet. Order a custom one through the form." : "Още няма готови дизайни. Поръчай собствен през формата."}
          </p>
        )}
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
    </div>
  );
}
