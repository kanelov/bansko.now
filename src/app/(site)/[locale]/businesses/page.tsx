import Link from "next/link";
import type { Metadata } from "next";
import { BusinessDirectoryView } from "@/components/public/business-directory-view";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getApprovedBusinesses, getBusinessDirectorySettings } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Route } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  return {
    title: { absolute: `${dictionary.businessesTitle} | Bansko NOW` },
    description: dictionary.businessesIntro,
    alternates: { canonical: localeUrl(locale, "/businesses"), languages: { bg: localeUrl("bg", "/businesses"), en: localeUrl("en", "/businesses"), "x-default": localeUrl("bg", "/businesses") } }
  };
}

export default async function BusinessesPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [siteSettings, directorySettings, businesses] = await Promise.all([
    getSiteSettings(locale),
    getBusinessDirectorySettings(locale),
    getApprovedBusinesses(locale)
  ]);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/businesses")} />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <header className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">Bansko NOW Local</p>
            <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold text-stone-950">
              {directorySettings.intro_title || "Местни бизнеси в Банско"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">
              {directorySettings.intro_description || "Открий места, услуги и локални партньори в Банско."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href={localePath(locale, "/businesses/map") as Route} className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss hover:text-white">
              {locale === "en" ? "View the map" : "Виж картата"}
            </Link>
            <Link href={localePath(locale, "/businesses/submit") as Route} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
              {dictionary.submitBusiness}
            </Link>
          </div>
        </header>
        <BusinessDirectoryView businesses={businesses} locale={locale} />
      </main>
      <SiteFooter settings={siteSettings} locale={locale} />
    </div>
  );
}
