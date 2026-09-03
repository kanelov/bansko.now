"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createGalleryReservationInlineAction, type GalleryReservationState } from "@/app/(site)/[locale]/art-studio/gallery/actions";
import { IconGlyph } from "@/components/public/icon-glyph";
import { localizeGalleryProductType, type GalleryDesignDetail, type GalleryDesignVariant } from "@/lib/art-studio-gallery-types";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const fieldClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

function variantLabel(variant: GalleryDesignVariant, locale: Locale) {
  return [variant.type_name ? localizeGalleryProductType(variant.type_name, locale) : null, variant.label].filter(Boolean).join(" · ");
}

/**
 * Collapsed "Наличност в галерията" for the selected design. Path A: a ready variant can be
 * reserved through the existing gallery reservation flow (inline panel). Path B: anything else is
 * ordered with the Art Studio form below, which already knows the selected design.
 * Render with key={design id} so the expanded state resets when the design changes.
 */
export function ArtStudioDesignAvailability({
  detail,
  loading,
  locale,
  orderAnchor = "#order"
}: {
  detail: GalleryDesignDetail | null;
  loading: boolean;
  locale: Locale;
  orderAnchor?: string;
}) {
  const isEnglish = locale === "en";
  const [showAll, setShowAll] = useState(false);
  const [reserveVariantId, setReserveVariantId] = useState<string | null>(null);

  const available = detail ? detail.variants.filter((variant) => variant.quantity_available > 0) : [];
  const others = detail ? detail.variants.filter((variant) => variant.quantity_available <= 0) : [];
  const summary = loading
    ? (isEnglish ? "Checking…" : "Проверяваме…")
    : !detail
      ? (isEnglish ? "Could not load" : "Не се зареди")
      : available.length
        ? (isEnglish ? `${available.length} ${available.length === 1 ? "size" : "sizes"} available` : `${available.length} ${available.length === 1 ? "размер наличен" : "размера налични"}`)
        : (isEnglish ? "No ready stock" : "Няма готова наличност");

  function scrollToOrder() {
    document.querySelector(orderAnchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-3">
      <details className="group rounded-xl border border-stone-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-stone-900">{isEnglish ? "Gallery stock" : "Наличност в галерията"}</span>
          <span className="flex items-center gap-2 text-stone-600">
            {summary}
            <IconGlyph name="chevron-down" className="h-3.5 w-3.5 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="grid gap-3 border-t border-stone-200 px-4 py-3 text-sm">
          {detail && available.length ? (
            <div className="grid gap-2">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">
                <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />
                {isEnglish ? "Available now in the gallery" : "Налично сега в галерията"}
              </p>
              <ul className="grid gap-1.5">
                {available.map((variant) => (
                  <li key={variant.id} className="flex items-center justify-between gap-3">
                    <span className="text-stone-800">
                      {variantLabel(variant, locale)} <span className="text-stone-500">{variant.quantity_available} {isEnglish ? "pcs" : "бр."}</span>
                    </span>
                    {detail.can_reserve ? (
                      <button
                        type="button"
                        onClick={() => setReserveVariantId(variant.id)}
                        className="shrink-0 rounded-full border border-forest px-3 py-1 text-xs font-semibold text-forest transition hover:bg-forest hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                      >
                        {isEnglish ? "Reserve it" : "Заяви наличността"}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : detail ? (
            <p className="text-stone-650">{isEnglish ? "No ready stock in the gallery right now." : "В момента няма готова наличност в галерията."}</p>
          ) : (
            <p className="text-stone-650">{loading ? (isEnglish ? "Loading stock…" : "Зареждаме наличността…") : (isEnglish ? "Stock could not be loaded. Order below and we will confirm." : "Наличността не се зареди. Поръчай отдолу и ще потвърдим.")}</p>
          )}

          {detail && others.length ? (
            <div className="grid gap-1.5">
              <button type="button" onClick={() => setShowAll((value) => !value)} className="w-fit text-xs font-semibold text-forest underline-offset-2 hover:underline">
                {showAll ? (isEnglish ? "Hide other sizes" : "Скрий другите размери") : (isEnglish ? "See all sizes" : "Виж всички размери")}
              </button>
              {showAll ? (
                <ul className="grid gap-1 text-stone-600">
                  {others.map((variant) => (
                    <li key={variant.id} className="flex items-center justify-between gap-3">
                      <span>{variantLabel(variant, locale)}</span>
                      <span className="text-xs">{isEnglish ? "by request" : "по заявка"}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg bg-paper p-3">
            <p className="text-stone-700">{isEnglish ? "This variant is not ready right now, but we can make it." : "Този вариант не е готов в момента, но можем да го изработим."}</p>
            <button type="button" onClick={scrollToOrder} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
              {isEnglish ? "Order this design" : "Поръчай този дизайн"}
              <IconGlyph name="arrow-right" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </details>

      {detail && reserveVariantId ? (
        <ReservationPanel key={reserveVariantId} detail={detail} locale={locale} variantId={reserveVariantId} onClose={() => setReserveVariantId(null)} />
      ) : null}
    </div>
  );
}

const errorMessages: Record<string, { bg: string; en: string }> = {
  invalid: { bg: "Заявката не беше приета.", en: "The request was not accepted." },
  unavailable: { bg: "Този продукт временно не приема заявки.", en: "This product is temporarily not accepting requests." },
  required: { bg: "Провери името, телефона, имейла и отметката за условията.", en: "Check the name, phone, email and the terms checkbox." },
  save: { bg: "Заявката не можа да бъде записана. Опитай отново.", en: "The request could not be saved. Try again." }
};

/** Compact inline version of the gallery reservation fields, revealed only on demand. */
function ReservationPanel({ detail, locale, variantId, onClose }: { detail: GalleryDesignDetail; locale: Locale; variantId: string; onClose: () => void }) {
  const isEnglish = locale === "en";
  const [state, formAction, pending] = useActionState<GalleryReservationState, FormData>(createGalleryReservationInlineAction, { status: "idle" });
  const [selectedVariantId, setSelectedVariantId] = useState(variantId);
  const [quantity, setQuantity] = useState(1);
  const selected = detail.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const fromStock = Boolean(selected && selected.quantity_available >= quantity);

  if (state.status === "success") {
    return (
      <section className="rounded-xl border border-forest/20 bg-sage/40 p-4" aria-live="polite">
        <p className="text-xs font-semibold uppercase text-moss">{isEnglish ? "Request received" : "Заявката е получена"}</p>
        <p className="mt-1 font-serif text-2xl font-semibold text-stone-950">{state.code}</p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          {isEnglish
            ? "Keep this number. We will contact you to confirm before pickup and payment at the gallery."
            : "Запази този номер. Ще се свържем с теб, за да потвърдим преди взимане и плащане в галерията."}
        </p>
      </section>
    );
  }

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-forest/30 bg-white p-4" aria-label={isEnglish ? "Gallery reservation" : "Заявка за наличност от галерията"}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="product_id" value={detail.id} />
      <input type="hidden" name="product_slug" value={detail.slug} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">{isEnglish ? "Reserve from the gallery" : "Заяви от галерията"}</p>
          <p className="mt-1 text-sm font-semibold text-stone-950">{detail.title}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={isEnglish ? "Close" : "Затвори"} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
          <IconGlyph name="xmark" className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
        <label className="grid gap-1 text-xs font-semibold text-stone-800">
          {isEnglish ? "Size / variant" : "Размер / вариант"}
          <select name="variant_id" required value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)} className={fieldClass}>
            {detail.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variantLabel(variant, locale)} {variant.quantity_available > 0 ? `(${variant.quantity_available} ${isEnglish ? "available" : "налични"})` : `(${isEnglish ? "by request" : "по заявка"})`}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-stone-800">
          {isEnglish ? "Qty" : "Брой"}
          <select name="quantity" required value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className={fieldClass}>
            {Array.from({ length: 20 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-stone-800">{isEnglish ? "Name" : "Име"}<input name="customer_name" required autoComplete="name" maxLength={120} className={fieldClass} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold text-stone-800">{isEnglish ? "Phone" : "Телефон"}<input name="customer_phone" type="tel" required autoComplete="tel" maxLength={60} className={fieldClass} /></label>
        <label className="grid gap-1 text-xs font-semibold text-stone-800">Email<input name="customer_email" type="email" required autoComplete="email" maxLength={180} className={fieldClass} /></label>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-stone-800">{isEnglish ? "Note (optional)" : "Бележка (по желание)"}<input name="note" maxLength={1200} className={fieldClass} placeholder={isEnglish ? "For example, preferred pickup day" : "Например предпочитан ден за взимане"} /></label>
      <label className="choice-row text-xs leading-5 text-stone-650">
        <input type="checkbox" name="accept_terms" required className="choice-control" />
        <span>{isEnglish ? "I accept the" : "Приемам"} <Link href={localePath(locale, "/terms")} className="font-semibold text-forest underline">{isEnglish ? "terms" : "условията"}</Link> {isEnglish ? "and" : "и"} <Link href={localePath(locale, "/privacy")} className="font-semibold text-forest underline">{isEnglish ? "privacy policy" : "политиката за поверителност"}</Link>.</span>
      </label>
      {state.status === "error" ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">{errorMessages[state.code]?.[locale] || errorMessages.save[locale]}</p>
      ) : null}
      <button disabled={pending} className="admin-button admin-button-forest w-full px-5 py-3 text-sm font-semibold">
        {pending ? (isEnglish ? "Sending…" : "Изпращаме…") : fromStock ? (isEnglish ? "Reserve the stock" : "Заяви наличността") : (isEnglish ? "Send product request" : "Изпрати заявка за продукта")}
      </button>
      <p className="text-center text-xs text-stone-500">{isEnglish ? "Payment at the gallery in Bansko. Stock is confirmed by the gallery." : "Плащане в галерията в Банско. Наличността се потвърждава от галерията."}</p>
    </form>
  );
}
