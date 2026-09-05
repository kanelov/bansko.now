import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { IconGlyph } from "@/components/public/icon-glyph";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getArtStudioProductTypes } from "@/lib/art-studio";
import { getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { getPhotoArchiveCopy, getPhotoBySlug, getPhotoLicenseTypes, getRecentPhotoSlugs, getRelatedPhotos, photoLicensePrice } from "@/lib/photos";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; slug: string }>;

// Each photograph is its own indexable page; this is the entry point from Google Images.
export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getRecentPhotoSlugs(100);
  return slugs.map((slug) => ({ slug }));
}

const money = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const photo = await getPhotoBySlug(slug, locale);
  if (!photo) return {};

  const canonical = localeUrl(locale, `/photos/${photo.slug}`);
  const title = locale === "en" ? `${photo.title} | Bansko photography` : `${photo.title} | Фотография от Банско`;
  const description =
    photo.description ||
    (locale === "en"
      ? `${photo.title}. Original photograph from ${photo.location_name || "Bansko and Pirin"}, available for web and print licensing.`
      : `${photo.title}. Авторска фотография от ${photo.location_name || "Банско и Пирин"}, достъпна за лиценз за уеб и печат.`);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        bg: localeUrl("bg", `/photos/${photo.slug}`),
        en: localeUrl("en", `/photos/${photo.slug}`),
        "x-default": localeUrl("bg", `/photos/${photo.slug}`)
      }
    },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: photo.preview_url ? [{ url: photo.preview_url, alt: photo.alt }] : undefined
    },
    twitter: { card: "summary_large_image", title, description, images: photo.preview_url ? [photo.preview_url] : undefined }
  };
}

export default async function PhotoPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const photo = await getPhotoBySlug(slug, locale);
  if (!photo) notFound();

  const isEnglish = locale === "en";
  const text = await getPhotoArchiveCopy(locale);
  const [licenses, related, settings, productTypes] = await Promise.all([
    getPhotoLicenseTypes(),
    getRelatedPhotos(photo, locale),
    getSiteSettings(locale),
    getArtStudioProductTypes({ locale })
  ]);

  const printType = productTypes.find((type) => type.internal_name === "fine-art-prints");
  const printHref = (photo.print_enabled && printType
    ? localePath(locale, `/art-studio/${printType.slug}?photo=${photo.slug}`)
    : localePath(locale, "/art-studio")) as Route;
  const pageUrl = localeUrl(locale, `/photos/${photo.slug}`);
  const dateLabel = photo.date_taken || (photo.year_taken ? String(photo.year_taken) : null);

  const imageSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: photo.title,
    description: photo.description || undefined,
    contentUrl: photo.preview_url || undefined,
    thumbnailUrl: photo.thumb_url || undefined,
    width: photo.width || undefined,
    height: photo.height || undefined,
    datePublished: photo.published_at || undefined,
    dateCreated: photo.date_taken || undefined,
    contentLocation: photo.location_name ? { "@type": "Place", name: photo.location_name } : undefined,
    keywords: photo.tags?.length ? photo.tags.join(", ") : undefined,
    creator: { "@type": "Person", name: text.photographerName },
    copyrightHolder: { "@type": "Person", name: text.photographerName },
    copyrightNotice: text.creditLine,
    creditText: text.creditLine.replace(/^©\s*/, ""),
    license: localeUrl(locale, "/terms"),
    acquireLicensePage: pageUrl,
    isPartOf: { "@id": `${siteUrl}/#website` },
    representativeOfPage: true
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEnglish ? "Home" : "Начало", item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: text.eyebrow, item: localeUrl(locale, "/photos") },
      ...(photo.category
        ? [{ "@type": "ListItem", position: 3, name: photo.category, item: localeUrl(locale, `/photos/category/${encodeURIComponent(photo.category.toLowerCase())}`) }]
        : []),
      { "@type": "ListItem", position: photo.category ? 4 : 3, name: photo.title, item: pageUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(isEnglish ? "bg" : "en", `/photos/${photo.slug}`)} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={isEnglish ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/") as Route}>{isEnglish ? "Home" : "Начало"}</Link>
          <span className="px-2">/</span>
          <Link href={localePath(locale, "/photos") as Route}>{text.eyebrow}</Link>
          {photo.category ? (
            <>
              <span className="px-2">/</span>
              <Link href={localePath(locale, `/photos/category/${encodeURIComponent(photo.category.toLowerCase())}`) as Route}>{photo.category}</Link>
            </>
          ) : null}
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-12">
          <figure className="lg:col-span-8">
            {photo.preview_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- deliberate: files are served from the R2 CDN
              <img
                src={photo.preview_url}
                alt={photo.alt}
                width={photo.width ?? 2000}
                height={photo.height ?? 1333}
                fetchPriority="high"
                decoding="async"
                className="w-full rounded-2xl bg-stone-100"
                draggable={false}
                onContextMenu={undefined}
              />
            ) : (
              <div className="aspect-[3/2] w-full rounded-2xl bg-sage" />
            )}
            {photo.caption ? <figcaption className="mt-3 text-sm text-stone-600">{photo.caption}</figcaption> : null}
          </figure>

          <aside className="grid gap-5 lg:col-span-4">
            <header>
              <p className="text-sm font-semibold uppercase text-moss">{text.photographLabel} {photo.photo_code}</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-stone-950">{photo.title}</h1>
              {photo.description ? <p className="mt-3 text-base leading-7 text-stone-650">{photo.description}</p> : null}
            </header>

            <dl className="grid gap-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "Photographer" : "Фотограф"}</dt><dd className="font-semibold text-stone-900">{text.photographerName}</dd></div>
              {photo.location_name ? <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "Location" : "Място"}</dt><dd className="font-semibold text-stone-900">{photo.location_name}</dd></div> : null}
              {dateLabel ? <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "Taken" : "Заснета"}</dt><dd className="font-semibold text-stone-900">{dateLabel}</dd></div> : null}
              {photo.width && photo.height ? <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "Size" : "Размер"}</dt><dd className="font-semibold text-stone-900">{photo.width} × {photo.height} px</dd></div> : null}
            </dl>

            {photo.licensing_enabled && licenses.length ? (
              <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft" aria-labelledby="licence-heading">
                <h2 id="licence-heading" className="font-serif text-2xl font-semibold text-stone-950">{text.licenseHeading}</h2>
                {licenses.map((license) => (
                  <div key={license.id} className="grid gap-1 rounded-xl border border-stone-200 p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <strong className="text-stone-950">{isEnglish ? license.name_en : license.name_bg}</strong>
                      <span className="font-semibold text-forest">{money(photoLicensePrice(photo, license), locale)}</span>
                    </div>
                    <p className="text-xs leading-5 text-stone-600">{isEnglish ? license.summary_en : license.summary_bg}</p>
                  </div>
                ))}
                <Link
                  href={localePath(locale, `/photos/${photo.slug}/license`) as Route}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss"
                >
                  {text.licenseButton}
                  <IconGlyph name="arrow-right" className="h-4 w-4" />
                </Link>
                <Link
                  href={printHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
                >
                  {text.printButton}
                </Link>
                <p className="text-center text-xs leading-5 text-stone-500">
                  {text.copyrightNote}
                </p>
              </section>
            ) : null}

            {photo.tags?.length ? (
              <ul className="flex flex-wrap gap-2">
                {photo.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">{tag}</li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>

        {related.length ? (
          <section className="mt-16" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-serif text-3xl font-semibold text-stone-950">{text.relatedHeading}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {related.map((item) => (
                <Link key={item.id} href={localePath(locale, `/photos/${item.slug}`) as Route} className="block overflow-hidden rounded-xl border border-stone-200 bg-stone-100 transition hover:border-moss">
                  {item.thumb_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- deliberate: files are served from the R2 CDN
                    <img src={item.thumb_url} alt={item.alt} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(imageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
