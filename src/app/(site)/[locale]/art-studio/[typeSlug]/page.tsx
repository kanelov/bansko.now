import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtStudioProductCard } from "@/components/public/art-studio-product-card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioCategories, getArtStudioProducts, getArtStudioProductTypes, getArtStudioTypeBySlug } from "@/lib/art-studio";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; typeSlug: string }>;

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

  const title = productType.seo_title || productType.title;
  const description = productType.seo_description || productType.description || undefined;
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

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const [products, categories, settings, alternate] = await Promise.all([
    getArtStudioProducts({ locale, productTypeId: productType.id }),
    getArtStudioCategories({ locale, productTypeId: productType.id }),
    getSiteSettings(locale),
    getAlternateType(productType.id, locale)
  ]);
  const pageUrl = localeUrl(locale, `/art-studio/${productType.slug}`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: productType.title,
    description: productType.description || undefined,
    url: pageUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.title,
        url: localeUrl(locale, `/art-studio/${productType.slug}/${product.slug}`)
      }))
    }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "en" ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: "Art Studio", item: localeUrl(locale, "/art-studio") },
      { "@type": "ListItem", position: 3, name: productType.title, item: pageUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={alternate ? localePath(alternateLocale, `/art-studio/${alternate.slug}`) : null} />
      <main>
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
            <nav className="text-sm text-stone-500" aria-label={locale === "en" ? "Breadcrumb" : "Навигация"}>
              <Link href={localePath(locale, "/art-studio")}>Art Studio</Link><span className="px-2">/</span><span>{productType.title}</span>
            </nav>
            <p className="mt-10 text-sm font-semibold uppercase text-moss">Art Studio</p>
            <h1 className="mt-3 max-w-4xl font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{productType.title}</h1>
            {productType.description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-650">{productType.description}</p> : null}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {categories.length ? (
            <nav className="mb-10 flex flex-wrap gap-2" aria-label={locale === "en" ? "Product categories" : "Продуктови категории"}>
              <a href="#all-products" className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss hover:text-white">{locale === "en" ? "All" : "Всички"}</a>
              {categories.map((category) => <a key={category.id} href={`#category-${category.slug}`} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-sage hover:text-forest">{category.title}</a>)}
            </nav>
          ) : null}

          <section id="all-products" aria-labelledby="all-products-heading">
            <h2 id="all-products-heading" className="font-serif text-4xl font-semibold text-stone-950">{locale === "en" ? "Designs and products" : "Дизайни и продукти"}</h2>
            {products.length ? (
              <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => <ArtStudioProductCard key={product.id} product={product} locale={locale} />)}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-stone-650">{locale === "en" ? "Products are being prepared." : "Продуктите се подготвят."}</p>
            )}
          </section>

          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category_id === category.id);
            if (!categoryProducts.length) return null;
            return (
              <section key={category.id} id={`category-${category.slug}`} className="scroll-mt-28 border-t border-stone-200 pt-12 mt-14">
                <h2 className="font-serif text-4xl font-semibold text-stone-950">{category.title}</h2>
                {category.description ? <p className="mt-3 max-w-3xl leading-7 text-stone-650">{category.description}</p> : null}
                <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {categoryProducts.map((product) => <ArtStudioProductCard key={product.id} product={product} locale={locale} />)}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
