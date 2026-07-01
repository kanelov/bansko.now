"use client";

import { useCallback, useEffect, useId, useState } from "react";
import type { GalleryImage } from "@/lib/markdown-blocks";

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const galleryId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const hasMultipleImages = images.length > 1;

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return current === 0 ? images.length - 1 : current - 1;
    });
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return current === images.length - 1 ? 0 : current + 1;
    });
  }, [images.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (!hasMultipleImages || activeIndex === null) {
        return;
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, hasMultipleImages, showNext, showPrevious]);

  if (!images.length) {
    return null;
  }

  return (
    <>
      <div className="not-prose mt-10 grid gap-6 sm:grid-cols-2">
        {images.map((image, index) => {
          const captionId = image.alt ? `${galleryId}-${index}-caption` : undefined;

          return (
            <figure key={`${image.src}-${index}`} className="grid gap-3" itemScope itemType="https://schema.org/ImageObject">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={image.alt ? `Отвори снимка: ${image.alt}` : "Отвори снимка"}
                aria-describedby={captionId}
                className="group block w-full rounded-[1.35rem] bg-stone-100 text-left text-stone-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="aspect-[4/3] w-full rounded-[1.35rem] object-cover transition duration-300 group-hover:scale-[1.015]"
                  loading="lazy"
                  decoding="async"
                  itemProp="contentUrl"
                />
              </button>
              {image.alt ? (
                <figcaption id={captionId} className="px-1 text-sm leading-6 text-stone-600" itemProp="caption">
                  {image.alt}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {activeImage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Галерия">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100"
          >
            Затвори
          </button>
          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-3xl leading-none text-stone-950 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                aria-label="Предишна снимка"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-3xl leading-none text-stone-950 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                aria-label="Следваща снимка"
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          ) : null}
          <figure className="grid max-h-[90vh] max-w-6xl gap-3" itemScope itemType="https://schema.org/ImageObject">
            <img src={activeImage.src} alt={activeImage.alt} className="max-h-[82vh] w-full rounded-2xl object-contain" itemProp="contentUrl" />
            <figcaption className="text-center text-sm text-stone-100">
              {activeImage.alt ? <span>{activeImage.alt}</span> : null}
              {hasMultipleImages ? (
                <span className="block pt-1 text-stone-300">
                  {(activeIndex ?? 0) + 1} / {images.length}
                </span>
              ) : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
