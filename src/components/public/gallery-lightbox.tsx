"use client";

import { useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/markdown-blocks";

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!images.length) {
    return null;
  }

  return (
    <>
      <div className="not-prose mt-10 grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group overflow-hidden rounded-2xl bg-stone-100 text-left text-stone-950 transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <img src={image.src} alt={image.alt} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
            {image.alt ? <span className="block px-4 py-3 text-sm leading-6 text-stone-600">{image.alt}</span> : null}
          </button>
        ))}
      </div>

      {activeImage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm"
          >
            Затвори
          </button>
          <figure className="grid max-h-[90vh] max-w-6xl gap-3">
            <img src={activeImage.src} alt={activeImage.alt} className="max-h-[82vh] w-full rounded-2xl object-contain" />
            {activeImage.alt ? <figcaption className="text-center text-sm text-stone-100">{activeImage.alt}</figcaption> : null}
          </figure>
        </div>
      ) : null}
    </>
  );
}
