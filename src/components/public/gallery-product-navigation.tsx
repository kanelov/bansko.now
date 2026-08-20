import Link from "next/link";
import type { Route } from "next";
import { IconGlyph } from "@/components/public/icon-glyph";
import type { Locale } from "@/lib/types";

type NavigationLink = {
  href: string | null;
  icon: "arrow-left" | "arrow-right" | "house" | "heart";
  label: string;
  title: string;
  rel?: "prev" | "next";
};

export function GalleryProductNavigation({
  locale,
  previousHref,
  previousTitle,
  nextHref,
  nextTitle,
  homeHref,
  mostLikedHref
}: {
  locale: Locale;
  previousHref: string | null;
  previousTitle?: string | null;
  nextHref: string | null;
  nextTitle?: string | null;
  homeHref: string;
  mostLikedHref: string | null;
}) {
  const isEnglish = locale === "en";
  const items: NavigationLink[] = [
    {
      href: previousHref,
      icon: "arrow-left",
      label: isEnglish ? "Back" : "Назад",
      title: previousTitle || (isEnglish ? "Previous product" : "Предишен продукт"),
      rel: "prev"
    },
    {
      href: nextHref,
      icon: "arrow-right",
      label: isEnglish ? "Next" : "Напред",
      title: nextTitle || (isEnglish ? "Next product" : "Следващ продукт"),
      rel: "next"
    },
    {
      href: homeHref,
      icon: "house",
      label: isEnglish ? "Home" : "Начало",
      title: isEnglish ? "Gallery home" : "Начало на галерията"
    },
    {
      href: mostLikedHref,
      icon: "heart",
      label: isEnglish ? "Most liked" : "Най-харесвани",
      title: isEnglish ? "Most liked products" : "Най-харесвани продукти"
    }
  ];

  return (
    <nav className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm" aria-label={isEnglish ? "Product navigation" : "Навигация между продуктите"}>
      <div className="grid grid-cols-4 divide-x divide-stone-200">
        {items.map((item) => item.href ? (
          <Link
            key={item.label}
            href={item.href as Route}
            rel={item.rel}
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
      </div>
    </nav>
  );
}
