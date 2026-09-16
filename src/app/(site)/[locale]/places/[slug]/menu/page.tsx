import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { BusinessHoursList, BusinessOpenBadge } from "@/components/public/business-hours";
import { BusinessMenuAnchors, BusinessMenuSections } from "@/components/public/business-menu";
import { sofiaDate } from "@/lib/business-platform/hours";
import { getPublicBusinessPlatform } from "@/lib/business-platform/public-business";
import { getApprovedBusinessTranslation, getBusinessBySlug } from "@/lib/businesses";
import { getDirectionsUrl } from "@/lib/business-public";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/**
 * QR менюто: страницата, която гостът отваря на масата. Лека и без клиентски
 * JavaScript - в заведението интернетът е слаб. Няма собствено съдържание:
 * всичко идва от същото меню, което собственикът пише в портала.
 */

export const revalidate = 900;

type Params = Promise<{ locale: string; slug: string }>;

const copy = {
  bg: { menu: "Меню", back: "Профил", directions: "Упътване", call: "Обади се", by: "Меню в Bansko NOW" },
  en: { menu: "Menu", back: "Profile", directions: "Directions", call: "Call", by: "Menu on Bansko NOW" }
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const business = await getBusinessBySlug(slug, locale);

  if (!business) {
    return { title: "Менюто не е намерено" };
  }

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const translation = await getApprovedBusinessTranslation(business.id, alternateLocale);
  const canonical = localeUrl(locale, `/places/${business.slug}/menu`);
  const languages: Record<string, string> = { [locale]: canonical };

  if (translation) {
    languages[alternateLocale] = localeUrl(alternateLocale, `/places/${translation.slug}/menu`);
  }

  languages["x-default"] = locale === "bg" ? canonical : languages.bg || canonical;

  return {
    title: { absolute: `${copy[locale].menu} · ${business.name} | Bansko NOW` },
    description:
      locale === "en"
        ? `The menu of ${business.name} in Bansko: dishes, drinks and current prices.`
        : `Менюто на ${business.name} в Банско: ястия, напитки и актуални цени.`,
    alternates: { canonical, languages },
    openGraph: { title: `${copy[locale].menu} · ${business.name}`, url: canonical, type: "website" }
  };
}

export default async function BusinessMenuPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const business = await getBusinessBySlug(slug, locale);

  if (!business) {
    notFound();
  }

  const platform = await getPublicBusinessPlatform(business.id, locale);

  if (!platform?.hasMenu) {
    notFound();
  }

  const text = copy[locale];
  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const translation = await getApprovedBusinessTranslation(business.id, alternateLocale);
  const categories = platform.menu.categories.filter((category) => category.items.length > 0);
  const profilePath = localePath(locale, `/places/${business.slug}`) as Route;

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${text.menu} · ${business.name}`,
    inLanguage: locale === "en" ? "en" : "bg",
    url: localeUrl(locale, `/places/${business.slug}/menu`),
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      description: category.description || undefined,
      hasMenuItem: category.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description || undefined,
        offers:
          item.priceCents !== null
            ? { "@type": "Offer", price: (item.priceCents / 100).toFixed(2), priceCurrency: "EUR" }
            : item.variants.map((variant) => ({
                "@type": "Offer",
                name: variant.name || undefined,
                price: (variant.priceCents / 100).toFixed(2),
                priceCurrency: "EUR"
              }))
      }))
    }))
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3 text-sm">
          <Link href={profilePath} className="font-semibold text-forest">
            ← {text.back}
          </Link>
          {translation ? (
            <Link href={localePath(alternateLocale, `/places/${translation.slug}/menu`) as Route} className="font-semibold text-stone-650">
              {alternateLocale === "en" ? "English" : "Български"}
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-2xl gap-8 px-4 py-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-stone-950">{business.name}</h1>
          <p className="mt-2 text-sm text-stone-650">{business.address}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <BusinessOpenBadge state={platform.openState} locale={locale} />
            <a
              href={getDirectionsUrl(business)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest"
            >
              {text.directions}
            </a>
            {business.phone ? (
              <a
                href={`tel:${business.phone.replace(/\s+/g, "")}`}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest"
              >
                {text.call}
              </a>
            ) : null}
          </div>
        </div>

        <BusinessMenuAnchors categories={categories} locale={locale} />
        <BusinessMenuSections categories={categories} locale={locale} />

        {platform.hasHours ? <BusinessHoursList hours={platform.hours} locale={locale} today={sofiaDate(new Date())} /> : null}

        <p className="border-t border-stone-200 pt-6 text-center text-xs text-stone-650">
          <Link href={localePath(locale, "/") as Route} className="font-semibold text-forest">
            {text.by}
          </Link>
        </p>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }} />
    </div>
  );
}
