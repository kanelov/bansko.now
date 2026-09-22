import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/fonts.css";
import "@/styles/menu-paper.css";
import { BusinessMenuList } from "@/components/public/business-menu-list";
import { OpeningStatusPill } from "@/components/public/opening-status-pill";
import { PaperMenuHead } from "@/components/public/paper-menu";
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
    <div className="paper font-portal min-h-screen">
      {/* Горе стои само лентата с категориите (и EN); заглавието е в самото меню, като на хартия. */}
      <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        <PaperMenuHead title={business.name} subtitle={labels.menu} className="qr-head" />
        <div className="mt-3 flex justify-center">
          <OpeningStatusPill status={opening.status} label={opening.label} />
        </div>
      </div>

      {/* Лепкавата лента е нарочно в друг цвят от хартията: тъмнозелена, с езика най-отпред. */}
      {menu.categories.length > 1 || alternate ? (
        <nav aria-label={labels.menu} className="sticky top-0 z-10 mt-5 bg-forest text-white shadow-[0_6px_18px_rgba(24,59,42,0.25)]">
          <div className="mx-auto flex max-w-2xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
            {alternate ? (
              <span className="flex flex-none items-center rounded-full border border-white/40 p-0.5 text-[11px] font-bold uppercase tracking-[0.12em]" aria-label={locale === "en" ? "Language" : "Език"}>
                {(["bg", "en"] as Locale[]).map((option) =>
                  option === locale ? (
                    <span key={option} className="rounded-full bg-white px-2.5 py-1 text-forest" aria-current="true">
                      {option.toUpperCase()}
                    </span>
                  ) : (
                    <Link
                      key={option}
                      href={localePath(option, `/places/${alternate.slug}/menu`)}
                      hrefLang={option}
                      className="rounded-full px-2.5 py-1 text-white/85 hover:text-white"
                    >
                      {option.toUpperCase()}
                    </Link>
                  )
                )}
              </span>
            ) : null}
            {alternate ? <span className="mx-1 h-5 w-px flex-none bg-white/30" aria-hidden /> : null}
            {menu.categories.map((category) => (
              <a
                key={category.id}
                href={`#menu-${category.id}`}
                className="flex-none rounded-full border border-white/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-forest"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      <main className="mx-auto max-w-2xl px-4 py-7 sm:px-6">
        <BusinessMenuList menu={menu} locale={locale} />
      </main>

      <footer className="mx-auto max-w-2xl px-4 pb-10 pt-4 text-sm text-[var(--paper-muted)] sm:px-6">
        <div className="paper-rule mb-5" aria-hidden>
          <span className="paper-rule__dot" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[var(--paper-ink)]">{business.name}</p>
          <p>{business.address}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {business.phone ? (
              <a href={`tel:${business.phone.replace(/\s+/g, "")}`} className="rounded-full bg-[var(--paper-accent)] px-4 py-2 text-xs font-semibold text-white">
                {labels.call}
              </a>
            ) : null}
            <Link href={profileHref} className="rounded-full border border-[var(--paper-line)] px-4 py-2 text-xs font-semibold text-[var(--paper-ink)]">
              {labels.profile}
            </Link>
          </div>
          <p className="mt-6 text-xs">
            <Link href={localePath(locale, "/")} className="font-semibold text-[var(--paper-accent)]">
              {labels.powered}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
