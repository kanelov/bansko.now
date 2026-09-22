import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/fonts.css";
import "@/styles/menu-paper.css";
import { BusinessMenuList } from "@/components/public/business-menu-list";
import { OpeningStatusPill } from "@/components/public/opening-status-pill";
import { PaperMenuHead } from "@/components/public/paper-menu";
import { getOpeningStatus } from "@/lib/business-platform/hours";
import { getBusinessIdsWithPublicMenu, getBusinessMenu } from "@/lib/business-platform/menu";
import { getBusinessTheme, themeClassName, themeStyle } from "@/lib/business-platform/theme";
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

/**
 * Менютата се построяват при деплой (и на 15 минути после), за да е смяната на
 * езика и първото отваряне от QR кода мигновени от CDN-а, без рендер и без
 * заявки към базата за всеки гост. Нов бизнес се рендерира при първото
 * отваряне (dynamicParams е включен по подразбиране).
 */
export async function generateStaticParams() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  const ids = await getBusinessIdsWithPublicMenu();
  if (ids.size === 0) return [];
  const { data } = await supabase.from("business_translations").select("business_id, locale, slug").in("business_id", [...ids]);
  return (data ?? []).filter((row) => isLocale(row.locale)).map((row) => ({ locale: row.locale, slug: row.slug }));
}

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

  const [menu, opening, alternate, branding] = await Promise.all([
    getBusinessMenu(supabase, business.id, { locale }),
    getOpeningStatus(supabase, business.id, locale),
    getApprovedBusinessTranslation(business.id, locale === "bg" ? "en" : "bg"),
    getBusinessTheme(supabase, business.id)
  ]);

  /* Бизнес без публикувано меню няма тънка страница. */
  if (menu.categories.length === 0) notFound();

  const alternateLocale: Locale = locale === "bg" ? "en" : "bg";
  const profileHref = localePath(locale, `/places/${business.slug}`);
  /* Темата на бизнеса важи само тук, на телевизора и на печата - не и за профила в Bansko NOW. */
  const { theme, logo, logoAlt } = branding;
  const logoSrc = logo?.w480 ?? logo?.w960 ?? logo?.original ?? null;
  const labels =
    locale === "en"
      ? { menu: "Menu", profile: "About the place", call: "Call", directions: "Directions", powered: "Menu by Bansko NOW", switch: "BG" }
      : { menu: "Меню", profile: "За мястото", call: "Обади се", directions: "Упътване", powered: "Меню от Bansko NOW", switch: "EN" };

  return (
    <div className={`${themeClassName(theme)} min-h-screen`} style={themeStyle(theme)}>
      {/* Скокът към категория е мигновен: глобалният smooth scroll би влачил през цялото меню. */}
      <style>{"html{scroll-behavior:auto}"}</style>
      {/* Горе стои само лентата с категориите (и EN); заглавието е в самото меню, като на хартия. */}
      <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        <PaperMenuHead
          title={business.name}
          subtitle={labels.menu}
          className="qr-head"
          ornament={theme.ornament}
          logo={logoSrc ? { src: logoSrc, alt: logoAlt ?? business.name } : null}
        />
        <div className="mt-3 flex justify-center">
          <OpeningStatusPill status={opening.status} label={opening.label} tone="paper" />
        </div>
      </div>

      {/* Лепкавата лента е в тон с хартията (--paper-bar), не в крещящ цвят. Езикът стои
          неподвижно вляво; само категориите се плъзгат хоризонтално в своя контейнер. */}
      {menu.categories.length > 1 || alternate ? (
        <nav
          aria-label={labels.menu}
          className="sticky top-0 z-10 mt-5 border-b border-[var(--paper-line)] bg-[var(--paper-bar)] text-[var(--paper-ink)] shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
        >
          <div className="mx-auto flex max-w-2xl items-center py-2.5 pl-4 sm:pl-6 md:items-start">
            {alternate ? (
              <>
                <span
                  className="flex flex-none items-center rounded-full border border-[var(--paper-line)] p-0.5 text-[11px] font-bold uppercase tracking-[0.12em] md:mt-0.5"
                  aria-label={locale === "en" ? "Language" : "Език"}
                >
                  {(["bg", "en"] as Locale[]).map((option) =>
                    option === locale ? (
                      <span key={option} className="rounded-full bg-[var(--paper-accent)] px-2.5 py-1 text-[var(--paper-on-accent)]" aria-current="true">
                        {option.toUpperCase()}
                      </span>
                    ) : (
                      <a
                        key={option}
                        href={localePath(option, `/places/${alternate.slug}/menu`)}
                        hrefLang={option}
                        className="rounded-full px-2.5 py-1 text-[var(--paper-ink)] hover:text-[var(--paper-accent)] focus-visible:text-[var(--paper-accent)] focus-visible:outline-none"
                      >
                        {option.toUpperCase()}
                      </a>
                    )
                  )}
                </span>
                {menu.categories.length > 1 ? <span className="ml-2.5 h-5 w-px flex-none bg-[var(--paper-line)] md:mt-1" aria-hidden /> : null}
              </>
            ) : null}
            {menu.categories.length > 1 ? (
              <div
                /* На телефон категориите се плъзгат в един ред; на широк екран се пренасят и се виждат всички. */
                className={`flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 pr-4 [scrollbar-width:none] sm:pr-6 md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden ${alternate ? "pl-2.5" : ""}`}
              >
                {menu.categories.map((category) => (
                  <a
                    key={category.id}
                    href={`#menu-${category.id}`}
                    className="flex-none rounded-full border border-[var(--paper-line)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-ink)] hover:border-[var(--paper-accent)] focus-visible:border-[var(--paper-accent)] focus-visible:outline-none"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            ) : null}
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
              <a href={`tel:${business.phone.replace(/\s+/g, "")}`} className="rounded-full bg-[var(--paper-accent)] px-4 py-2 text-xs font-semibold text-[var(--paper-on-accent)]">
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
