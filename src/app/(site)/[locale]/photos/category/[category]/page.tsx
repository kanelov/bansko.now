import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { PhotoArchive } from "@/components/public/photo-archive";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { getPhotoFacets, getPublishedPhotos } from "@/lib/photos";

type Params = Promise<{ locale: string; category: string }>;

// One indexable page per category: this is what ranks for "снимки от Пирин" and similar.
export const revalidate = 900;
export const dynamicParams = true;

// Category pages are rendered on first request and then cached: generateStaticParams cannot
// read the database here because it runs outside a request scope.
export async function generateStaticParams() {
  return [];
}

async function resolveCategory(raw: string) {
  const decoded = decodeURIComponent(raw).toLowerCase();
  const facets = await getPhotoFacets();
  return facets.categories.find((item) => item.toLowerCase() === decoded) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isLocale(locale)) return {};
  const name = await resolveCategory(category);
  if (!name) return {};
  const canonical = localeUrl(locale, `/photos/category/${category}`);
  const title = locale === "en" ? `${name} photographs of Bansko and Pirin` : `Фотографии: ${name} от Банско и Пирин`;
  const description =
    locale === "en"
      ? `Original ${name.toLowerCase()} photographs from Bansko, Pirin and the region. Available for web and print licensing or as a made to order print.`
      : `Авторски фотографии в категория ${name.toLowerCase()} от Банско, Пирин и региона. Лиценз за уеб и печат или принт по поръчка.`;
  return {
    title: { absolute: `${title} | Bansko NOW` },
    description,
    alternates: {
      canonical,
      languages: {
        bg: localeUrl("bg", `/photos/category/${category}`),
        en: localeUrl("en", `/photos/category/${category}`),
        "x-default": localeUrl("bg", `/photos/category/${category}`)
      }
    },
    openGraph: { type: "website", url: canonical, title, description }
  };
}

export default async function PhotoCategoryPage({ params }: { params: Params }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  const name = await resolveCategory(category);
  if (!name) notFound();

  const [initial, facets, settings] = await Promise.all([
    getPublishedPhotos(locale, { page: 1, category: name }),
    getPhotoFacets(),
    getSiteSettings(locale)
  ]);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", `/photos/category/${category}`)} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <nav className="text-sm text-stone-500" aria-label={locale === "en" ? "Breadcrumb" : "Навигация"}>
          <Link href={localePath(locale, "/") as Route}>{locale === "en" ? "Home" : "Начало"}</Link>
          <span className="px-2">/</span>
          <Link href={localePath(locale, "/photos") as Route}>{locale === "en" ? "Photo Library" : "Фотоархив"}</Link>
          <span className="px-2">/</span>
          <span className="text-stone-700">{name}</span>
        </nav>
        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "Photo Library" : "Фотоархив"}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">{name}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-650">
            {locale === "en"
              ? `Photographs in the ${name.toLowerCase()} collection. Every photograph can be licensed or ordered as a print.`
              : `Фотографии в колекция ${name.toLowerCase()}. Всяка може да се лицензира или да се поръча като принт.`}
          </p>
        </header>
        <div className="mt-10">
          <PhotoArchive locale={locale} initial={initial} facets={facets} lockedFilter={{ category: name }} />
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
