import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/fonts.css";
import { BusinessMenuList } from "@/components/public/business-menu-list";
import { OpeningStatusPill } from "@/components/public/opening-status-pill";
import { getOpeningStatus } from "@/lib/business-platform/hours";
import { getBusinessMenu } from "@/lib/business-platform/menu";
import { getApprovedBusinessTranslation, getBusinessBySlug } from "@/lib/businesses";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Locale } from "@/lib/types";

/**
 * QR менюто: лека статична страница за телефона на гостите. Чете същото
 * getBusinessMenu() като портала и телевизорите; порталът я пресъздава при
 * всеки запис, иначе - на 15 минути.
 */
export const revalidate = 900;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const business = await getBusinessBySlug(slug, locale);

  if (!business) {
    return { title: locale === "en" ? "Menu not found" : "Менюто не е намерено" };
  }

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const translation = await getApprovedBusinessTranslation(business.id, alternateLocale);
  const canonical = localeUrl(locale, `/places/${business.slug}/menu`);
  const languages: Record<string, string> = { [locale]: canonical };
  if (translation) {
    languages[alternateLocale] = localeUrl(alternateLocale, `/places/${translation.slug}/menu`);
    languages["x-default"] = locale === "bg" ? canonical : localeUrl("bg", `/places/${translation.slug}/menu`);
  } else if (locale === "bg") {
    languages["x-default"] = canonical;
  }

  return {
    title: { absolute: locale === "en" ? `${business.name} – Menu | Bansko NOW` : `${business.name} – Меню | Bansko NOW` },
    description:
      locale === "en"
        ? `Menu and prices at ${business.name}, Bansko. Updated by the owner.`
        : `Меню и цени в ${business.name}, Банско. Обновява се от самото заведение.`,
    alternates: { canonical, languages },
    robots: { index: business.robots_index ?? true, follow: business.robots_follow ?? true }
  };
}

export default async function BusinessMenuPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const business = await getBusinessBySlug(slug, locale);
  const supabase = createPublicSupabaseClient();
  if (!business || !supabase) notFound();

  const [menu, opening, alternate] = await Promise.all([
    getBusinessMenu(supabase, business.id, { locale }),
    getOpeningStatus(supabase, business.id, locale),
    getApprovedBusinessTranslation(business.id, locale === "bg" ? "en" : "bg")
  ]);

  /* Бизнес без публикувано меню няма тънка страница. */
  if (menu.categories.length === 0) notFound();

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const profileHref = localePath(locale, `/places/${business.slug}`);
  const labels =
    locale === "en"
      ? { menu: "Menu", profile: "About the place", call: "Call", directions: "Directions", powered: "Menu by Bansko NOW", switch: "BG" }
      : { menu: "Меню", profile: "За мястото", call: "Обади се", directions: "Упътване", powered: "Меню от Bansko NOW", switch: "EN" };

  return (
    <div className="font-portal min-h-screen bg-paper text-[var(--ink)]">
      <header className="sticky top-0 z-10 border-b border-[var(--stone)] bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">{labels.menu}</p>
            <h1 className="font-display truncate text-xl font-semibold text-forest">{business.name}</h1>
            <div className="mt-1">
              <OpeningStatusPill status={opening.status} label={opening.label} />
            </div>
          </div>
          {alternate ? (
            <Link
              href={localePath(alternateLocale, `/places/${alternate.slug}/menu`)}
              hrefLang={alternateLocale}
              className="flex-none rounded-full border border-[var(--stone)] bg-white px-3 py-1 text-xs font-semibold"
            >
              {labels.switch}
            </Link>
          ) : null}
        </div>
        {menu.categories.length > 1 ? (
          <nav aria-label={labels.menu} className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
            {menu.categories.map((category) => (
              <a key={category.id} href={`#menu-${category.id}`} className="flex-none rounded-full border border-[var(--stone)] bg-white px-3 py-1 text-xs font-semibold">
                {category.name}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <BusinessMenuList menu={menu} locale={locale} />
      </main>

      <footer className="mx-auto max-w-2xl px-4 pb-10 pt-6 text-sm text-stone-650 sm:px-6">
        <div className="border-t border-[var(--stone)] pt-6">
          <p className="font-semibold text-[var(--ink)]">{business.name}</p>
          <p>{business.address}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {business.phone ? (
              <a href={`tel:${business.phone.replace(/\s+/g, "")}`} className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">
                {labels.call}
              </a>
            ) : null}
            <Link href={profileHref} className="rounded-full border border-[var(--stone)] bg-white px-4 py-2 text-xs font-semibold">
              {labels.profile}
            </Link>
          </div>
          <p className="mt-6 text-xs">
            <Link href={localePath(locale, "/")} className="font-semibold text-forest">
              {labels.powered}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
