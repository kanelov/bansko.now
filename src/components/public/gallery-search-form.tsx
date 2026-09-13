import Link from "next/link";
import type { Route } from "next";
import type { Locale } from "@/lib/types";

/**
 * Търсене в галерията. Обикновена форма с method="get" — работи и без JavaScript,
 * а резултатът се смята на сървъра, така че страницата остава лека.
 */
export function GallerySearchForm({
  locale,
  action,
  value,
  placeholder,
  resultCount
}: {
  locale: Locale;
  action: Route;
  value: string;
  placeholder?: string;
  resultCount?: number | null;
}) {
  const isEnglish = locale === "en";
  const query = value.trim();

  return (
    <div className="mb-8">
      <form action={action} method="get" role="search" className="flex flex-wrap items-center gap-3">
        <label htmlFor="gallery-search" className="sr-only">
          {isEnglish ? "Search the gallery" : "Търсене в галерията"}
        </label>
        <input
          id="gallery-search"
          type="search"
          name="q"
          defaultValue={query}
          enterKeyHint="search"
          autoComplete="off"
          placeholder={placeholder || (isEnglish ? "Name or code, e.g. giraffe or SA71" : "Име или код, например жираф или SA71")}
          className="h-12 min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-5 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-forest"
        />
        <button
          type="submit"
          className="h-12 rounded-full border border-forest bg-forest px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-forest"
        >
          {isEnglish ? "Search" : "Търси"}
        </button>
      </form>

      {query ? (
        <p className="mt-3 text-sm text-stone-600">
          {typeof resultCount === "number"
            ? isEnglish
              ? `${resultCount} results for “${query}”`
              : `${resultCount} резултата за „${query}“`
            : isEnglish
              ? `Results for “${query}”`
              : `Резултати за „${query}“`}
          <Link href={action} className="ml-3 font-semibold text-forest underline">
            {isEnglish ? "Clear" : "Изчисти"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
