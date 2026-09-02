import Link from "next/link";
import type { Route } from "next";
import { getCategories, getNavigationItems, getPublishedArticleCounts, getSiteSettings, getSocialLinks } from "@/lib/content";
import type { Category, NavigationItem, SocialLink } from "@/lib/types";
import { IconGlyph } from "./icon-glyph";
import { SiteSearch } from "./site-search";
import { SupportProjectButton } from "./support-project-button";
import { getDictionary, getSocialLabel, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function isExternalUrl(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

function linkProps(href: string, openInNewTab?: boolean) {
  const shouldOpenInNewTab = openInNewTab || isExternalUrl(href);

  return {
    target: shouldOpenInNewTab ? "_blank" : undefined,
    rel: shouldOpenInNewTab ? "noopener noreferrer" : undefined
  };
}

function DesktopMenuItem({ item, locale }: { item: NavigationItem; locale: Locale }) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-forest hover:text-white";
  const label = (
    <>
      <IconGlyph name={item.icon_name} className="h-3.5 w-3.5 shrink-0" />
      <span>{item.label}</span>
    </>
  );

  if (item.is_external || isExternalUrl(item.href)) {
    return (
      <a href={item.href} aria-label={item.aria_label || item.label} className={className} {...linkProps(item.href, item.open_in_new_tab)}>
        {label}
      </a>
    );
  }

  return (
    <Link href={localePath(locale, item.href) as Route} aria-label={item.aria_label || item.label} className={className}>
      {label}
    </Link>
  );
}

function MobileMenuItem({ item, locale }: { item: NavigationItem; locale: Locale }) {
  const className = "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-forest hover:text-white";
  const label = (
    <>
      <IconGlyph name={item.icon_name} className="h-4 w-4 shrink-0 text-forest transition group-hover:text-white" />
      <span>{item.label}</span>
    </>
  );

  if (item.is_external || isExternalUrl(item.href)) {
    return (
      <a href={item.href} aria-label={item.aria_label || item.label} className={className} {...linkProps(item.href, item.open_in_new_tab)}>
        {label}
      </a>
    );
  }

  return (
    <Link href={localePath(locale, item.href) as Route} aria-label={item.aria_label || item.label} className={className}>
      {label}
    </Link>
  );
}

type ArticlesMenuData = { categories: Category[]; counts: Map<string, number> };

function DesktopArticlesMenu({ locale, data }: { locale: Locale; data: ArticlesMenuData }) {
  const dictionary = getDictionary(locale);
  const itemClassName =
    "group/item flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-forest hover:text-white";

  return (
    <div className="group relative">
      <Link
        href={localePath(locale, "/articles") as Route}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-sage hover:text-forest group-focus-within:bg-sage group-focus-within:text-forest group-hover:bg-sage group-hover:text-forest"
        aria-haspopup="true"
      >
        <IconGlyph name="newspaper" className="h-3.5 w-3.5 shrink-0" />
        <span>{dictionary.articlesMenu}</span>
        <IconGlyph name="chevron-down" className="h-3 w-3 shrink-0" />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="w-72 rounded-2xl border border-stone-200 bg-paper p-2 shadow-xl">
          <Link href={localePath(locale, "/articles") as Route} className={itemClassName}>
            <span className="flex items-center gap-2">
              <IconGlyph name="newspaper" className="h-4 w-4 text-forest" />
              {dictionary.allArticles}
            </span>
          </Link>
          {data.categories.length ? (
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase text-stone-400">{dictionary.categoriesLabel}</p>
          ) : null}
          {data.categories.map((category) => (
            <Link key={category.id} href={localePath(locale, `/${category.slug}`) as Route} className={itemClassName}>
              <span>{category.name}</span>
              {data.counts.get(category.id) ? (
                <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-forest transition group-hover/item:bg-white">
                  {data.counts.get(category.id)}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileArticlesMenu({ locale, data }: { locale: Locale; data: ArticlesMenuData }) {
  const dictionary = getDictionary(locale);
  const itemClassName = "group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-sage hover:text-forest";

  return (
    <details className="rounded-xl" open>
      <summary className="group flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-sage hover:text-forest">
        <IconGlyph name="newspaper" className="h-4 w-4 text-forest" />
        <span>{dictionary.articlesMenu}</span>
        <IconGlyph name="chevron-down" className="ml-auto h-3 w-3" />
      </summary>
      <div className="mt-1 grid gap-1 border-l border-stone-200 pl-3">
        <Link href={localePath(locale, "/articles") as Route} className={itemClassName}>
          {dictionary.allArticles}
        </Link>
        {data.categories.map((category) => (
          <Link key={category.id} href={localePath(locale, `/${category.slug}`) as Route} className={itemClassName}>
            <span>{category.name}</span>
            {data.counts.get(category.id) ? (
              <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-forest transition group-hover:bg-white">{data.counts.get(category.id)}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </details>
  );
}

function SocialIconLink({ link, locale }: { link: SocialLink; locale: Locale }) {
  const label = getSocialLabel(link.platform, link.label, locale);

  return (
    <a
      href={link.url}
      aria-label={label}
      title={label}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white/60 text-forest transition hover:border-forest hover:bg-forest hover:text-white"
      target="_blank"
      rel="noopener noreferrer"
    >
      <IconGlyph name={link.icon_name || link.platform} className="h-4 w-4 text-current transition group-hover:text-white" />
    </a>
  );
}

export async function SiteHeader({ locale = "bg", alternateHref }: { locale?: Locale; alternateHref?: string | null }) {
  const dictionary = getDictionary(locale);
  const [settings, navItems, categories, counts] = await Promise.all([
    getSiteSettings(locale),
    getNavigationItems(locale),
    getCategories(locale),
    getPublishedArticleCounts(locale)
  ]);
  const socialLinks = await getSocialLinks(settings);
  const articlesMenu: ArticlesMenuData = { categories, counts };
  const languageHref = alternateHref === undefined ? localePath(locale === "bg" ? "en" : "bg", "/") : alternateHref;
  const siteName = settings.site_name || "Bansko NOW";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[rgba(250,248,242,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={localePath(locale, "/") as Route} className="shrink-0 font-serif text-2xl font-semibold text-forest" aria-label={`${siteName} ${dictionary.home}`}>
          {settings.logo_image_url ? (
            <img
              src={settings.logo_image_url}
              alt={settings.logo_image_alt || siteName}
              width={180}
              height={48}
              className="h-10 w-auto max-w-44 object-contain"
            />
          ) : (
            siteName
          )}
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex" aria-label={dictionary.navigation}>
          <DesktopArticlesMenu locale={locale} data={articlesMenu} />
          {navItems.map((item) => (
            <DesktopMenuItem key={item.id} item={item} locale={locale} />
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <SiteSearch locale={locale} />
          {socialLinks.map((link) => (
            <SocialIconLink key={link.id} link={link} locale={locale} />
          ))}
          {languageHref ? (
            <Link
              href={languageHref as Route}
              hrefLang={locale === "bg" ? "en" : "bg"}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-stone-300 bg-white/60 px-3 text-xs font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
              aria-label={dictionary.otherLocaleName}
            >
              {locale === "bg" ? "EN" : "BG"}
            </Link>
          ) : null}
          <SupportProjectButton settings={settings} locale={locale} />
        </div>

        <details className="group relative lg:hidden">
          <summary className="list-none rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
            {dictionary.menu}
          </summary>
          <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-200 bg-paper p-3 shadow-xl">
            <nav className="grid gap-1" aria-label={dictionary.mobileNavigation}>
              <MobileArticlesMenu locale={locale} data={articlesMenu} />
              {navItems.map((item) => (
                <MobileMenuItem key={item.id} item={item} locale={locale} />
              ))}
              <SiteSearch compact locale={locale} />
              {languageHref ? (
                <Link href={languageHref as Route} hrefLang={locale === "bg" ? "en" : "bg"} className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-forest hover:text-white">
                  <IconGlyph name="globe" className="h-4 w-4 text-forest transition group-hover:text-white" />
                  {dictionary.otherLocaleName}
                </Link>
              ) : null}
            </nav>
            <div className="mt-3 flex items-center gap-2 border-t border-stone-200 pt-3">
              {socialLinks.map((link) => (
                <SocialIconLink key={link.id} link={link} locale={locale} />
              ))}
              <SupportProjectButton settings={settings} locale={locale} />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
