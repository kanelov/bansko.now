"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useRef, useState } from "react";
import { IconGlyph } from "@/components/public/icon-glyph";
import { localePath } from "@/lib/i18n";
import type { LocalizedPhotoCard } from "@/lib/photos";
import type { Locale } from "@/lib/types";

type Facets = { categories: string[]; locations: string[]; years: number[] };
type Filters = { category: string; location: string; season: string; orientation: string; year: string; q: string };

const emptyFilters: Filters = { category: "", location: "", season: "", orientation: "", year: "", q: "" };
const selectClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

/**
 * The archive grid. The first page is rendered on the server (cached, indexable);
 * filters and further pages come from /api/photos so the page itself stays static.
 */
export function PhotoArchive({
  locale,
  initial,
  facets,
  lockedFilter,
  printBase
}: {
  locale: Locale;
  initial: { photos: LocalizedPhotoCard[]; total: number; page: number; pageCount: number };
  facets: Facets;
  lockedFilter?: Partial<Filters>;
  /** Path of the Art Studio print page; the photo is passed to it as ?photo=<slug>. */
  printBase?: string | null;
}) {
  const isEnglish = locale === "en";
  const [photos, setPhotos] = useState(initial.photos);
  const [page, setPage] = useState(initial.page);
  const [pageCount, setPageCount] = useState(initial.pageCount);
  const [total, setTotal] = useState(initial.total);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, ...lockedFilter });
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (nextFilters: Filters, nextPage: number, append: boolean) => {
      const id = ++requestId.current;
      setLoading(true);
      const params = new URLSearchParams({ locale, page: String(nextPage) });
      for (const [key, value] of Object.entries(nextFilters)) if (value) params.set(key === "q" ? "q" : key, value);
      try {
        const response = await fetch(`/api/photos?${params.toString()}`);
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as typeof initial;
        if (id !== requestId.current) return;
        setPhotos((current) => (append ? [...current, ...data.photos] : data.photos));
        setPage(data.page);
        setPageCount(data.pageCount);
        setTotal(data.total);
      } catch {
        if (id === requestId.current && !append) setPhotos([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [locale, initial]
  );

  function change(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    void load(next, 1, false);
  }

  const seasons = isEnglish
    ? [["winter", "Winter"], ["spring", "Spring"], ["summer", "Summer"], ["autumn", "Autumn"]]
    : [["winter", "Зима"], ["spring", "Пролет"], ["summer", "Лято"], ["autumn", "Есен"]];
  const orientations = isEnglish
    ? [["landscape", "Landscape"], ["portrait", "Portrait"], ["square", "Square"]]
    : [["landscape", "Хоризонтална"], ["portrait", "Вертикална"], ["square", "Квадратна"]];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[12rem]">
          <span className="sr-only">{isEnglish ? "Search photographs" : "Търси във фотоархива"}</span>
          <input
            type="search"
            defaultValue={filters.q}
            onChange={(event) => change("q", event.target.value)}
            placeholder={isEnglish ? "Search: Vihren, winter, town…" : "Търси: Вихрен, зима, град…"}
            className={`${selectClass} w-full`}
          />
        </label>
        {!lockedFilter?.category && facets.categories.length ? (
          <select value={filters.category} onChange={(event) => change("category", event.target.value)} className={selectClass}>
            <option value="">{isEnglish ? "All categories" : "Всички категории"}</option>
            {facets.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        ) : null}
        {facets.locations.length ? (
          <select value={filters.location} onChange={(event) => change("location", event.target.value)} className={selectClass}>
            <option value="">{isEnglish ? "All locations" : "Всички места"}</option>
            {facets.locations.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        ) : null}
        <select value={filters.season} onChange={(event) => change("season", event.target.value)} className={selectClass}>
          <option value="">{isEnglish ? "All seasons" : "Всички сезони"}</option>
          {seasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={filters.orientation} onChange={(event) => change("orientation", event.target.value)} className={selectClass}>
          <option value="">{isEnglish ? "Any orientation" : "Всякаква ориентация"}</option>
          {orientations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {facets.years.length ? (
          <select value={filters.year} onChange={(event) => change("year", event.target.value)} className={selectClass}>
            <option value="">{isEnglish ? "Any year" : "Всяка година"}</option>
            {facets.years.map((item) => <option key={item} value={String(item)}>{item}</option>)}
          </select>
        ) : null}
      </div>

      <p className="text-sm text-stone-600" aria-live="polite">
        {loading ? (isEnglish ? "Loading…" : "Зареждаме…") : isEnglish ? `${total} photographs` : `${total} фотографии`}
      </p>

      {photos.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft transition hover:border-moss">
              <Link
                href={localePath(locale, `/photos/${photo.slug}`) as Route}
                className="group block"
                aria-label={photo.title}
              >
                <span
                  className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-stone-100"
                  style={photo.dominant_color ? { backgroundColor: `${photo.dominant_color}22` } : undefined}
                >
                  {photo.thumb_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- deliberate: files are served from the R2 CDN
                    <img
                      src={photo.thumb_url}
                      alt={photo.alt}
                      width={photo.width ?? 800}
                      height={photo.height ?? 1067}
                      loading={index < 4 ? "eager" : "lazy"}
                      decoding="async"
                      className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <IconGlyph name="image" className="h-6 w-6 text-stone-400" />
                  )}
                </span>
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-3">
                <Link href={localePath(locale, `/photos/${photo.slug}`) as Route} className="font-serif text-base font-semibold leading-snug text-stone-950 hover:text-forest">
                  {photo.title}
                </Link>
                <div className="mt-auto grid gap-2">
                  <Link
                    href={localePath(locale, `/photos/${photo.slug}/license`) as Route}
                    className="inline-flex items-center justify-center rounded-full bg-forest px-3 py-2 text-xs font-semibold text-white transition hover:bg-moss"
                  >
                    {isEnglish ? "License" : "Лицензирай"}
                  </Link>
                  <Link
                    href={(printBase ? `${printBase}?photo=${photo.slug}` : localePath(locale, "/art-studio")) as Route}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
                  >
                    {isEnglish ? "Order a print" : "Поръчай принт"}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-650">
          {isEnglish ? "No photographs match this search yet." : "Няма фотографии за това търсене."}
        </p>
      )}

      {page < pageCount ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => load(filters, page + 1, true)}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white disabled:opacity-50"
          >
            {loading ? (isEnglish ? "Loading…" : "Зареждаме…") : isEnglish ? "Show more" : "Покажи още"}
            <IconGlyph name="chevron-down" className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
