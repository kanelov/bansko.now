"use client";

import { IconGlyph } from "@/components/public/icon-glyph";
import type { Locale } from "@/lib/types";

const buttonClassName = "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2 text-center text-stone-700 transition hover:bg-forest hover:text-white focus-visible:bg-forest focus-visible:text-white focus-visible:outline-none sm:min-h-18 sm:px-3";

export function GalleryHistoryButtons({ locale }: { locale: Locale }) {
  const isEnglish = locale === "en";

  return (
    <>
      <button
        type="button"
        onClick={() => window.history.back()}
        title={isEnglish ? "Go back one visited page" : "Върни една посетена страница назад"}
        aria-label={isEnglish ? "Go back one visited page" : "Върни една посетена страница назад"}
        className={`${buttonClassName} rounded-l-lg`}
      >
        <IconGlyph name="arrow-left" className="h-4 w-4 shrink-0" />
        <span className="max-w-full text-[11px] font-semibold leading-4 sm:text-xs">
          {isEnglish ? "Back" : "Назад"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => window.history.forward()}
        title={isEnglish ? "Go forward one visited page" : "Продължи една посетена страница напред"}
        aria-label={isEnglish ? "Go forward one visited page" : "Продължи една посетена страница напред"}
        className={buttonClassName}
      >
        <IconGlyph name="arrow-right" className="h-4 w-4 shrink-0" />
        <span className="max-w-full text-[11px] font-semibold leading-4 sm:text-xs">
          {isEnglish ? "Forward" : "Напред"}
        </span>
      </button>
    </>
  );
}
