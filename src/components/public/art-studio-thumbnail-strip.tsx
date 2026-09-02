"use client";

import { useCallback, useEffect, useState } from "react";
import { IconGlyph } from "@/components/public/icon-glyph";
import type { Locale } from "@/lib/types";

export type ThumbnailImage = { src: string; alt: string; href?: string };

/**
 * Small square thumbnails of example designs with a minimal lightbox
 * (previous/next/close, keyboard). Images are plain <img> tags on purpose.
 */
export function ArtStudioThumbnailStrip({ images, locale, title: customTitle }: { images: ThumbnailImage[]; locale: Locale; title?: string }) {
  const isEnglish = locale === "en";
  const [active, setActive] = useState<number | null>(null);
  const close = useCallback(() => setActive(null), []);
  const previous = useCallback(() => setActive((current) => (current === null ? current : current === 0 ? images.length - 1 : current - 1)), [images.length]);
  const next = useCallback(() => setActive((current) => (current === null ? current : current === images.length - 1 ? 0 : current + 1)), [images.length]);

  useEffect(() => {
    if (active === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, close, previous, next]);

  if (!images.length) return null;
  const current = active === null ? null : images[active];
  const title = customTitle || (isEnglish ? "Example designs" : "Примерни дизайни");
  const buttonClass = "grid h-10 w-10 place-items-center rounded-full bg-white text-forest shadow transition hover:bg-forest hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <section className="mt-6" aria-label={title}>
      <p className="text-sm font-semibold uppercase text-moss">{title}</p>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <li key={image.src} className="shrink-0">
            <button
              type="button"
              onClick={() => setActive(index)}
              className="group block h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:h-24 sm:w-24"
              aria-label={`${isEnglish ? "Open" : "Отвори"}: ${image.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic */}
              <img src={image.src} alt="" loading="lazy" decoding="async" width={200} height={200} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <div role="dialog" aria-modal="true" aria-label={current.alt} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4" onClick={close}>
          <div className="relative w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic */}
            <img src={current.src} alt={current.alt} className="max-h-[78vh] w-full rounded-2xl bg-stone-900 object-contain" />
            <p className="mt-3 text-center text-sm text-white/90">
              {current.alt}
              {current.href ? (
                <>
                  {" · "}
                  <a href={current.href} className="font-semibold text-white underline">{isEnglish ? "Open the design" : "Отвори дизайна"}</a>
                </>
              ) : null}
            </p>
            <button type="button" onClick={close} aria-label={isEnglish ? "Close" : "Затвори"} className={`${buttonClass} absolute -right-2 -top-2`}>
              <IconGlyph name="xmark" className="h-4 w-4" />
            </button>
            {images.length > 1 ? (
              <>
                <button type="button" onClick={previous} aria-label={isEnglish ? "Previous" : "Предишна"} className={`${buttonClass} absolute left-2 top-1/2 -translate-y-1/2`}>
                  <IconGlyph name="chevron-left" className="h-4 w-4" />
                </button>
                <button type="button" onClick={next} aria-label={isEnglish ? "Next" : "Следваща"} className={`${buttonClass} absolute right-2 top-1/2 -translate-y-1/2`}>
                  <IconGlyph name="chevron-right" className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
