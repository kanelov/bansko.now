import Link from "next/link";
import type { Metadata } from "next";
import { IllustratedBusinessMap } from "@/components/public/illustrated-business-map";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getApprovedBusinesses, getBusinessDirectorySettings } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Route } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const path = "/businesses/map";
  return {
    title: { absolute: locale === "en" ? "Bansko business map | Bansko NOW" : "Карта на бизнесите в Банско | Bansko NOW" },
    description: locale === "en" ? "An illustrated map of local businesses, places and services in Bansko." : "Илюстрирана карта с местни бизнеси, места и услуги в Банско.",
    alternates: { canonical: localeUrl(locale, path), languages: { bg: localeUrl("bg", path), en: localeUrl("en", path), "x-default": localeUrl("bg", path) } }
  };
}

export default async function BusinessMapPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [siteSettings, directorySettings, businesses] = await Promise.all([
    getSiteSettings(locale),
    getBusinessDirectorySettings(locale),
    getApprovedBusinesses(locale)
  ]);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/businesses/map")} />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "Map" : "Карта"}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{locale === "en" ? "Bansko as an illustration" : "Банско като илюстрация"}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">
              {locale === "en" ? "Discover businesses on a beautiful map of the town and open directions in Google Maps." : "Откривай бизнеси върху красива карта на града и отваряй упътване в Google Maps."}
            </p>
          </div>
          <Link href={localePath(locale, "/businesses") as Route} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
            {locale === "en" ? "Back to directory" : "Към каталога"}
          </Link>
        </header>
        <IllustratedBusinessMap businesses={businesses} settings={directorySettings} locale={locale} />
      </main>
      <SiteFooter settings={siteSettings} locale={locale} />
    </div>
  );
}
