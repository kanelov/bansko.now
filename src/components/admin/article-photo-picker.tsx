"use client";

import { useCallback, useRef, useState } from "react";
import type { LocalizedPhotoCard } from "@/lib/photos";
import type { Locale } from "@/lib/types";

/**
 * Picks a photograph from the photo library for an article. The same file is reused, never
 * uploaded again: the article gets the 1800px derivative from R2 and a credit line that links
 * to the licensing page.
 */
export function ArticlePhotoPicker({
  locale,
  onFeatured,
  onInsert
}: {
  locale: Locale;
  onFeatured: (photo: LocalizedPhotoCard) => void;
  onInsert: (snippet: string) => void;
}) {
  const [photos, setPhotos] = useState<LocalizedPhotoCard[]>([]);
  const loaded = useRef(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (term: string) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ locale, page: "1" });
      if (term) params.set("q", term);
      const response = await fetch(`/api/photos?${params.toString()}`);
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { photos: LocalizedPhotoCard[] };
      if (id !== requestId.current) return;
      setPhotos(data.photos);
      setFailed(false);
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [locale]);

  // Loaded on first paint through a ref instead of an effect, so no cascading render.
  if (!loaded.current) {
    loaded.current = true;
    void load("");
  }

  function snippetFor(photo: LocalizedPhotoCard) {
    if (!photo.article_url) return "";
    const licenseUrl = `/${locale === "en" ? "en/" : ""}photos/${photo.slug}`;
    const credit = locale === "en" ? "License this photograph" : "Лицензирай тази фотография";
    return `\n\n![${photo.alt}](${photo.article_url})\n*© Lubo Kanelov · [${credit}](${licenseUrl})*\n`;
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-stone-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl font-semibold">Фотоархив</h3>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            void load(event.target.value);
          }}
          placeholder="Търси: Вихрен, зима, град…"
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950"
        />
      </div>
      {failed ? <p className="text-sm text-stone-600">Фотоархивът не се зареди.</p> : null}
      <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
        {photos.slice(0, 8).map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-950">
            {photo.thumb_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- deliberate: files are served from the R2 CDN
              <img src={photo.thumb_url} alt={photo.alt} className="aspect-[4/3] w-full bg-stone-100 object-contain" />
            ) : null}
            <div className="grid gap-1 p-2">
              <span className="truncate text-xs font-semibold text-stone-700" title={photo.title}>
                {photo.photo_code} · {photo.title}
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => onFeatured(photo)}
                  className="rounded-full bg-forest px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-moss"
                >
                  Главна
                </button>
                <button
                  type="button"
                  onClick={() => onInsert(snippetFor(photo))}
                  className="rounded-full border border-stone-300 px-2 py-1.5 text-[11px] font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
                >
                  В текста
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && !photos.length && !failed ? (
        <p className="text-sm text-stone-600">Няма публикувани фотографии за това търсене.</p>
      ) : null}
    </div>
  );
}
