import Link from "next/link";
import type { Route } from "next";
import { getNavigationItems, getSiteSettings, getSocialLinks } from "@/lib/content";
import type { NavigationItem, SocialLink } from "@/lib/types";
import { IconGlyph } from "./icon-glyph";
import { SiteSearch } from "./site-search";

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

function DesktopMenuItem({ item }: { item: NavigationItem }) {
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
    <Link href={item.href as Route} aria-label={item.aria_label || item.label} className={className}>
      {label}
    </Link>
  );
}

function MobileMenuItem({ item }: { item: NavigationItem }) {
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
    <Link href={item.href as Route} aria-label={item.aria_label || item.label} className={className}>
      {label}
    </Link>
  );
}

function SocialIconLink({ link }: { link: SocialLink }) {
  return (
    <a
      href={link.url}
      aria-label={link.label}
      title={link.label}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white/60 text-forest transition hover:border-forest hover:bg-forest hover:text-white"
      target="_blank"
      rel="noopener noreferrer"
    >
      <IconGlyph name={link.icon_name || link.platform} className="h-4 w-4 text-current transition group-hover:text-white" />
    </a>
  );
}

function AdminLink({ showLabel = false }: { showLabel?: boolean }) {
  return (
    <Link
      href="/admin"
      aria-label="Админ панел"
      title="Админ панел"
      className={
        showLabel
          ? "group inline-flex h-9 items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-forest hover:text-white"
          : "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white/60 text-forest transition hover:border-forest hover:bg-forest hover:text-white"
      }
    >
      <IconGlyph name="user-shield" className="h-4 w-4 text-current transition group-hover:text-white" />
      {showLabel ? <span className="transition group-hover:text-white">Админ</span> : null}
    </Link>
  );
}

export async function SiteHeader() {
  const [settings, navItems] = await Promise.all([getSiteSettings(), getNavigationItems()]);
  const socialLinks = await getSocialLinks(settings);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[rgba(250,248,242,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 font-serif text-2xl font-semibold text-forest" aria-label="Bansko NOW начало">
          Bansko NOW
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex" aria-label="Основна навигация">
          {navItems.map((item) => (
            <DesktopMenuItem key={item.id} item={item} />
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/articles"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-forest hover:bg-forest hover:text-white"
          >
            Всички статии
          </Link>
          <SiteSearch />
          {socialLinks.map((link) => (
            <SocialIconLink key={link.id} link={link} />
          ))}
          <AdminLink showLabel />
        </div>

        <details className="group relative lg:hidden">
          <summary className="list-none rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
            Меню
          </summary>
          <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-200 bg-paper p-3 shadow-xl">
            <nav className="grid gap-1" aria-label="Мобилна навигация">
              {navItems.map((item) => (
                <MobileMenuItem key={item.id} item={item} />
              ))}
              <SiteSearch compact />
              <Link href="/articles" className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-forest hover:text-white">
                <IconGlyph name="newspaper" className="h-4 w-4 text-forest transition group-hover:text-white" />
                Всички статии
              </Link>
            </nav>
            <div className="mt-3 flex items-center gap-2 border-t border-stone-200 pt-3">
              {socialLinks.map((link) => (
                <SocialIconLink key={link.id} link={link} />
              ))}
              <AdminLink showLabel />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
