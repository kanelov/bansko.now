"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { SiteSettings } from "@/lib/types";
import { IconGlyph } from "./icon-glyph";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function safePaymentUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function SupportProjectButton({ settings, locale = "bg" }: { settings: SiteSettings; locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const stripeUrl = safePaymentUrl(settings.support_stripe_url);
  const paypalUrl = safePaymentUrl(settings.support_paypal_url);
  const imageUrl = settings.support_image_url || settings.default_og_image;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (settings.support_enabled === false) {
    return null;
  }

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-stone-950/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-paper shadow-[0_32px_90px_rgba(0,0,0,0.35)] md:grid md:grid-cols-[0.9fr_1.1fr]"
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label={dictionary.close}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-950 shadow-md transition hover:bg-forest hover:text-white"
        >
          <IconGlyph name="xmark" className="h-4 w-4 text-current" />
        </button>

        {imageUrl ? (
          <div className="aspect-[16/9] min-h-52 overflow-hidden bg-sage md:aspect-auto md:min-h-full">
            <img
              src={imageUrl}
              alt={settings.support_image_alt || (locale === "en" ? "Support Bansko NOW" : "Подкрепи Bansko NOW")}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest">
            <IconGlyph name="heart" className="h-5 w-5" />
          </span>
          <h2 id={titleId} className="mt-5 font-serif text-3xl font-semibold text-stone-950">
            {settings.support_title || (locale === "en" ? "Support Bansko NOW" : "Подкрепи Bansko NOW")}
          </h2>
          <p id={descriptionId} className="mt-4 text-sm leading-7 text-stone-650">
            {settings.support_description ||
              (locale === "en"
                ? "If Bansko NOW is useful to you, support independent local stories, photography and ideas with an amount of your choice."
                : "Ако Bansko NOW ти е полезен, можеш да подкрепиш независимите местни истории, снимки и идеи с избрана от теб сума.")}
          </p>

          {stripeUrl || paypalUrl ? (
            <>
              <div className="mt-6 grid gap-3">
                {stripeUrl ? (
                  <a
                    href={stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss hover:text-white"
                  >
                    <IconGlyph name="heart" className="h-4 w-4" />
                    {locale === "en" ? "Support with Stripe" : "Подкрепи със Stripe"}
                  </a>
                ) : null}
                {paypalUrl ? (
                  <a
                    href={paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
                  >
                    {locale === "en" ? "Support with PayPal" : "Подкрепи с PayPal"}
                  </a>
                ) : null}
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                {locale === "en" ? "Choose the amount on the secure payment page." : "Избираш сумата в защитената страница за плащане."}
              </p>
            </>
          ) : (
            <p className="mt-6 rounded-xl bg-sage/50 p-4 text-sm font-medium text-forest">
              {locale === "en" ? "Online support will be available soon." : "Възможността за онлайн подкрепа ще бъде активна скоро."}
            </p>
          )}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="group inline-flex h-9 items-center gap-2 rounded-full bg-forest px-3 text-sm font-semibold text-white transition hover:bg-moss hover:text-white"
      >
        <IconGlyph name="heart" className="h-4 w-4 text-current" />
        <span>{settings.support_button_label || dictionary.support}</span>
      </button>
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
