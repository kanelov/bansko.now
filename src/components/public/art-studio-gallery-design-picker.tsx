"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useRef, useState } from "react";
import { ArtStudioDesignAvailability } from "@/components/public/art-studio-design-availability";
import { IconGlyph } from "@/components/public/icon-glyph";
import type { GalleryDesignCard, GalleryDesignDetail, GalleryDesignsPage, GalleryPickerConfig, SelectedGalleryDesign } from "@/lib/art-studio-gallery-types";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const selectClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";
const pagerButtonClass = "grid h-9 w-9 place-items-center rounded-full border border-stone-300 bg-white text-forest transition hover:border-forest hover:bg-forest hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:bg-white disabled:hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

/**
 * Compact "Готови дизайни": category select, a 2 × 2 grid of four gallery designs at a time and
 * a selected-design summary with gallery stock. Reads the gallery through the server routes only,
 * four products per request, and never duplicates gallery data.
 */
export function ArtStudioGalleryDesignPicker({
  locale,
  config,
  firstPage,
  selected,
  onSelect,
  onClear
}: {
  locale: Locale;
  config: GalleryPickerConfig;
  firstPage: GalleryDesignsPage | null;
  selected: SelectedGalleryDesign | null;
  onSelect: (design: SelectedGalleryDesign) => void;
  onClear: () => void;
}) {
  const isEnglish = locale === "en";
  const [categoryId, setCategoryId] = useState(firstPage?.category_id || config.categories[0].id);
  const [page, setPage] = useState<GalleryDesignsPage | null>(firstPage);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(!firstPage);
  const [browsing, setBrowsing] = useState(!selected);
  const [detail, setDetail] = useState<GalleryDesignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const requestId = useRef(0);
  const detailRequestId = useRef(0);

  const loadPage = useCallback(async (nextCategoryId: string, nextPage: number) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const response = await fetch(`/api/art-studio/designs?locale=${locale}&category=${encodeURIComponent(nextCategoryId)}&page=${nextPage}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as GalleryDesignsPage;
      if (id !== requestId.current) return;
      setPage(data);
      setFailed(false);
    } catch {
      if (id !== requestId.current) return;
      setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [locale]);

  // Variants and stock are fetched only after a design is chosen (event handler, not an effect).
  function loadDetail(designId: string) {
    const id = ++detailRequestId.current;
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/art-studio/designs/${designId}?locale=${locale}`)
      .then((response) => (response.ok ? (response.json() as Promise<GalleryDesignDetail>) : null))
      .then((data) => {
        if (id === detailRequestId.current) setDetail(data);
      })
      .catch(() => {
        if (id === detailRequestId.current) setDetail(null);
      })
      .finally(() => {
        if (id === detailRequestId.current) setDetailLoading(false);
      });
  }

  function changeCategory(nextId: string) {
    setCategoryId(nextId);
    void loadPage(nextId, 1);
  }

  function choose(card: GalleryDesignCard) {
    onSelect({ id: card.id, title: card.title, slug: card.slug, image_url: card.image_url });
    setBrowsing(false);
    loadDetail(card.id);
  }

  const category = config.categories.find((item) => item.id === categoryId) ?? config.categories[0];
  const allDesignsHref = localePath(locale, `/art-studio/gallery/category/${category.slug}`) as Route;
  const items = page?.items ?? [];
  const pageCount = page?.page_count ?? 0;
  const currentPage = page?.page ?? 1;

  return (
    <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft" aria-labelledby="ready-designs-heading">
      <header>
        <h2 id="ready-designs-heading" className="font-serif text-2xl font-semibold text-stone-950">{isEnglish ? "Ready designs" : "Готови дизайни"}</h2>
        <p className="mt-1 text-sm text-stone-650">{isEnglish ? "Pick one of our designs or order with your own idea." : "Избери наш дизайн или поръчай със своя идея."}</p>
      </header>

      {selected && !browsing ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-forest/30 bg-sage/30 p-3">
            <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
              {selected.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
                <img src={selected.image_url} alt="" width={128} height={128} className="h-full w-full object-cover" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-stone-950">{selected.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-forest">
                <IconGlyph name="check" className="h-3 w-3" />
                {isEnglish ? "Selected design" : "Избран дизайн"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                <button type="button" onClick={() => setBrowsing(true)} className="text-forest hover:underline">{isEnglish ? "Change" : "Смени"}</button>
                <button type="button" onClick={onClear} className="text-stone-600 hover:text-stone-900 hover:underline">{isEnglish ? "Use my own design" : "Използвай собствен дизайн"}</button>
                <Link href={localePath(locale, `/art-studio/gallery/${selected.slug}`) as Route} className="text-stone-600 hover:text-stone-900 hover:underline">{isEnglish ? "Open in the gallery" : "Виж в галерията"}</Link>
              </div>
            </div>
          </div>
          <ArtStudioDesignAvailability key={selected.id} detail={detail} loading={detailLoading} locale={locale} />
        </div>
      ) : (
        <div className="grid gap-3">
          {config.categories.length > 1 ? (
            <label className="grid gap-1 text-xs font-semibold text-stone-800">
              {isEnglish ? "Category" : "Категория"}
              <select value={categoryId} onChange={(event) => changeCategory(event.target.value)} className={selectClass}>
                {config.categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          ) : null}

          {failed ? (
            <p className="rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">{isEnglish ? "Ready designs cannot be loaded right now." : "Готовите дизайни временно не могат да се заредят."}</p>
          ) : (
            <div className={`grid grid-cols-2 gap-2 transition ${loading ? "opacity-60" : ""}`} aria-busy={loading} aria-label={category.name}>
              {items.map((card, index) => {
                const isSelected = selected?.id === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => choose(card)}
                    title={card.title}
                    aria-label={`${isEnglish ? "Choose design" : "Избери дизайн"}: ${card.title}`}
                    aria-pressed={isSelected}
                    className={`group relative aspect-square overflow-hidden rounded-xl border bg-stone-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${isSelected ? "border-forest ring-2 ring-forest/60" : "border-stone-200 hover:border-moss"}`}
                  >
                    {card.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
                      <img
                        src={card.image_url}
                        alt={card.image_alt}
                        width={320}
                        height={320}
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-stone-400"><IconGlyph name="image" className="h-6 w-6" /></span>
                    )}
                    {isSelected ? (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-forest text-white" aria-hidden="true">
                        <IconGlyph name="check" className="h-3 w-3" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!loading && !items.length ? (
                <p className="col-span-2 rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">{isEnglish ? "No designs in this category yet." : "Още няма дизайни в тази категория."}</p>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => loadPage(categoryId, currentPage - 1)} disabled={loading || currentPage <= 1} aria-label={isEnglish ? "Previous four" : "Предишните 4"} className={pagerButtonClass}>
                <IconGlyph name="chevron-left" className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs text-stone-500">{pageCount ? `${currentPage} / ${pageCount}` : ""}</span>
              <button type="button" onClick={() => loadPage(categoryId, currentPage + 1)} disabled={loading || currentPage >= pageCount} aria-label={isEnglish ? "Next four" : "Следващите 4"} className={pagerButtonClass}>
                <IconGlyph name="chevron-right" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              {selected ? (
                <button type="button" onClick={() => setBrowsing(false)} className="text-stone-600 hover:text-stone-900 hover:underline">{isEnglish ? "Keep selection" : "Запази избора"}</button>
              ) : null}
              <Link href={allDesignsHref} className="text-forest hover:underline">{isEnglish ? "All designs" : "Всички дизайни"}</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
