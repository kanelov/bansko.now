import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { PhotoArchive } from "@/components/public/photo-archive";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProductTypes } from "@/lib/art-studio";
import { getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { getPhotoArchiveCopy, getPhotoFacets, getPublishedPhotos } from "@/lib/photos";

type Params = Promise<{ locale: string }>;

// The archive is cached; filters and further pages are loaded from /api/photos.
export const revalidate = 900;

export async function generateStaticParams() {
  return [{ locale: "bg" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const text = await getPhotoArchiveCopy(locale);
  const canonical = localeUrl(locale, "/photos");
  return {
    title: { absolute: `${text.title} | Bansko NOW` },
    description: text.metaDescription,
    alternates: {
      canonical,
      languages: { bg: localeUrl("bg", "/photos"), en: localeUrl("en", "/photos"), "x-default": localeUrl("bg", "/photos") }
    },
    openGraph: { type: "website", url: canonical, title: text.title, description: text.metaDescription },
    robots: { index: true, follow: true }
  };
}

export default async function PhotosPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = await getPhotoArchiveCopy(locale);
  const [initial, facets, settings, productTypes] = await Promise.all([
    getPublishedPhotos(locale, { page: 1 }),
    getPhotoFacets(),
    getSiteSettings(locale),
    getArtStudioProductTypes({ locale })
  ]);
  const printType = productTypes.find((type) => type.internal_name === "fine-art-prints");
  const printBase = printType ? localePath(locale, `/art-studio/${printType.slug}`) : null;

  const pageUrl = localeUrl(locale, "/photos");
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: text.title,
    description: text.metaDescription,
    url: pageUrl,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: ["Bansko", "Pirin", "Bulgaria"],
    mainEntity: {
      "@type": "ImageGallery",
      name: text.title,
      numberOfItems: initial.total
    }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "en" ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: text.eyebrow, item: pageUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/photos")} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={locale === "en" ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/") as Route}>{locale === "en" ? "Home" : "Начало"}</Link>
          <span className="px-2">/</span>
          <span className="text-stone-700">{text.eyebrow}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase text-moss">{text.eyebrow}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{text.title}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-650">{text.lead}</p>
        </header>

        {facets.categories.length ? (
          <nav className="mt-8 flex flex-wrap gap-2" aria-label={text.categoriesLabel}>
            {facets.categories.map((category) => (
              <Link
                key={category}
                href={localePath(locale, `/photos/category/${encodeURIComponent(category.toLowerCase())}`) as Route}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
              >
                {category}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="mt-10">
          <PhotoArchive locale={locale} initial={initial} facets={facets} printBase={printBase} />
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
