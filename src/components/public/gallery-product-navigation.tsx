import Link from "next/link";
import type { Route } from "next";
import { GalleryHistoryButtons } from "@/components/public/gallery-history-buttons";
import { IconGlyph } from "@/components/public/icon-glyph";
import type { Locale } from "@/lib/types";

type NavigationLink = {
  href: string | null;
  icon: "house";
  label: string;
  title: string;
};

export function GalleryProductNavigation({
  locale,
  previousHref,
  previousTitle,
  nextHref,
  nextTitle,
  homeHref,
  mostLikedHref,
  mostLikedCategories
}: {
  locale: Locale;
  previousHref: string | null;
  previousTitle?: string | null;
  nextHref: string | null;
  nextTitle?: string | null;
  homeHref: string;
  mostLikedHref: string | null;
  mostLikedCategories: Array<{ href: string; label: string }>;
}) {
  const isEnglish = locale === "en";
  const items: NavigationLink[] = [
    {
      href: homeHref,
      icon: "house",
      label: isEnglish ? "Home" : "Начало",
      title: isEnglish ? "Gallery home" : "Начало на галерията"
    }
  ];

  return (
    <nav className="relative mt-6 rounded-lg border border-stone-200 bg-white shadow-sm" aria-label={isEnglish ? "Product navigation" : "Навигация между продуктите"}>
      <div className="grid grid-cols-4 divide-x divide-stone-200">
        <GalleryHistoryButtons locale={locale} />
        {items.map((item) => item.href ? (
          <Link
            key={item.label}
            href={item.href as Route}
            title={item.title}
            className="group flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2 text-center text-stone-700 transition hover:bg-forest hover:text-white focus-visible:bg-forest focus-visible:text-white focus-visible:outline-none sm:min-h-18 sm:px-3"
          >
            <IconGlyph name={item.icon} className="h-4 w-4 shrink-0" />
            <span className="max-w-full text-[11px] font-semibold leading-4 sm:text-xs">{item.label}</span>
          </Link>
        ) : (
          <span key={item.label} aria-disabled="true" title={item.title} className="flex min-h-16 min-w-0 cursor-not-allowed flex-col items-center justify-center gap-1 px-1.5 py-2 text-center text-stone-300 sm:min-h-18 sm:px-3">
            <IconGlyph name={item.icon} className="h-4 w-4 shrink-0" />
            <span className="max-w-full text-[11px] font-semibold leading-4 sm:text-xs">{item.label}</span>
          </span>
        ))}
        <div className="group relative min-w-0">
          {mostLikedHref ? (
            <Link
              href={mostLikedHref as Route}
              title={isEnglish ? "Most liked products" : "Най-харесвани продукти"}
              className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-r-lg px-1.5 py-2 text-center text-stone-700 transition hover:bg-forest hover:text-white focus-visible:bg-forest focus-visible:text-white focus-visible:outline-none sm:min-h-18 sm:px-3"
            >
              <IconGlyph name="heart" className="h-4 w-4 shrink-0" />
              <span className="max-w-full text-[11px] font-semibold leading-4 sm:text-xs">{isEnglish ? "Most liked" : "Най-харесвани"}</span>
            </Link>
          ) : (
            <span aria-disabled="true" className="flex min-h-16 min-w-0 cursor-not-allowed flex-col items-center justify-center gap-1 px-1.5 py-2 text-center text-stone-300 sm:min-h-18 sm:px-3">
              <IconGlyph name="heart" className="h-4 w-4 shrink-0" />
              <span className="max-w-full text-[11px] font-semibold leading-4 sm:text-xs">{isEnglish ? "Most liked" : "Най-харесвани"}</span>
            </span>
          )}
          {mostLikedCategories.length ? (
            <div className="invisible absolute right-0 top-full z-40 w-64 translate-y-2 pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="grid gap-1 rounded-lg border border-stone-200 bg-white p-2 shadow-soft" role="menu" aria-label={isEnglish ? "Most liked categories" : "Категории Най-харесвани"}>
                {mostLikedCategories.map((category) => (
                  <Link key={category.href} href={category.href as Route} role="menuitem" className="rounded-md px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-forest hover:text-white focus-visible:bg-forest focus-visible:text-white focus-visible:outline-none">
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-stone-200 border-t border-stone-200">
        {previousHref ? (
          <Link
            href={previousHref as Route}
            rel="prev"
            title={previousTitle || (isEnglish ? "Previous product" : "Предишен продукт")}
            className="group flex min-h-16 min-w-0 items-center gap-3 rounded-bl-lg px-3 py-2 text-stone-700 transition hover:bg-forest hover:text-white focus-visible:bg-forest focus-visible:text-white focus-visible:outline-none sm:px-5"
          >
            <IconGlyph name="arrow-left" className="h-4 w-4 shrink-0" />
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-semibold uppercase leading-4 opacity-70 sm:text-xs">
                {isEnglish ? "Previous product" : "Предишен продукт"}
              </span>
              <span className="block truncate text-xs font-semibold sm:text-sm">
                {previousTitle || (isEnglish ? "Previous" : "Предишен")}
              </span>
            </span>
          </Link>
        ) : (
          <span aria-disabled="true" className="flex min-h-16 min-w-0 items-center gap-3 rounded-bl-lg px-3 py-2 text-stone-300 sm:px-5">
            <IconGlyph name="arrow-left" className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold sm:text-sm">{isEnglish ? "No previous product" : "Няма предишен продукт"}</span>
          </span>
        )}
        {nextHref ? (
          <Link
            href={nextHref as Route}
            rel="next"
            title={nextTitle || (isEnglish ? "Next product" : "Следващ продукт")}
            className="group flex min-h-16 min-w-0 items-center justify-end gap-3 rounded-br-lg px-3 py-2 text-right text-stone-700 transition hover:bg-forest hover:text-white focus-visible:bg-forest focus-visible:text-white focus-visible:outline-none sm:px-5"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase leading-4 opacity-70 sm:text-xs">
                {isEnglish ? "Next product" : "Следващ продукт"}
              </span>
              <span className="block truncate text-xs font-semibold sm:text-sm">
                {nextTitle || (isEnglish ? "Next" : "Следващ")}
              </span>
            </span>
            <IconGlyph name="arrow-right" className="h-4 w-4 shrink-0" />
          </Link>
        ) : (
          <span aria-disabled="true" className="flex min-h-16 min-w-0 items-center justify-end gap-3 rounded-br-lg px-3 py-2 text-right text-stone-300 sm:px-5">
            <span className="text-xs font-semibold sm:text-sm">{isEnglish ? "No next product" : "Няма следващ продукт"}</span>
            <IconGlyph name="arrow-right" className="h-4 w-4 shrink-0" />
          </span>
        )}
      </div>
    </nav>
  );
}
