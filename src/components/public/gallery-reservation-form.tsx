"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createGalleryReservationAction } from "@/app/(site)/[locale]/art-studio/gallery/actions";
import { localePath } from "@/lib/i18n";
import type { LocalizedGalleryProduct } from "@/lib/gallery-catalog";
import type { Locale } from "@/lib/types";

const fieldClass = "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

const englishProductTypes: Record<string, string> = {
  "Дамски тениски": "Women's T-shirts",
  "Унисекс тениски": "Unisex T-shirts",
  "Детски тениски": "Kids' T-shirts",
  "Бебешки бодита": "Baby bodysuits",
  "Принтове": "Prints",
  "Платна": "Canvas prints",
  "Аксесоари": "Accessories"
};

export function GalleryReservationForm({
  product,
  locale,
  reservationCode,
  reservationError
}: {
  product: LocalizedGalleryProduct;
  locale: Locale;
  reservationCode?: string | null;
  reservationError?: string | null;
}) {
  const isEnglish = locale === "en";
  const safeReservationCode = /^BN-\d{4}-\d{6}$/.test(reservationCode || "") ? reservationCode : null;
  const productTypes = useMemo(() => {
    const types = new Map<string, { id: string; name: string; sort_order: number }>();
    product.variants.forEach((variant) => {
      if (variant.product_type) types.set(variant.product_type.id, variant.product_type);
    });
    return [...types.values()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [product.variants]);
  const firstAvailableVariant = product.variants.find((variant) => variant.quantity_available > 0) ?? product.variants[0];
  const [selectedTypeId, setSelectedTypeId] = useState(firstAvailableVariant?.product_type?.id || productTypes[0]?.id || "");
  const [selectedVariantId, setSelectedVariantId] = useState(firstAvailableVariant?.id || "");
  const [quantity, setQuantity] = useState(1);
  const variantsForType = product.variants.filter((variant) => variant.product_type?.id === selectedTypeId);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const availableVariants = product.variants.filter((variant) => variant.quantity_available > 0);
  const selectedFromStock = Boolean(selectedVariant && selectedVariant.quantity_available >= quantity);
  const typeName = (name: string) => isEnglish ? englishProductTypes[name] || name : name;

  function chooseType(typeId: string) {
    setSelectedTypeId(typeId);
    const firstVariant = product.variants.find((variant) => variant.product_type?.id === typeId);
    setSelectedVariantId(firstVariant?.id || "");
  }

  function chooseAvailableVariant(variantId: string) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return;
    setSelectedTypeId(variant.product_type?.id || "");
    setSelectedVariantId(variant.id);
    setQuantity(1);
    document.getElementById("request-fields")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (safeReservationCode) {
    return (
      <section id="reserve" className="rounded-lg border border-forest/20 bg-sage/40 p-6" aria-live="polite">
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Request received" : "Заявката е получена"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{safeReservationCode}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          {isEnglish
            ? "Keep this number. We will contact you to confirm availability before pickup and payment at the gallery."
            : "Запази този номер. Ще се свържем с теб, за да потвърдим наличността преди взимане и плащане в галерията."}
        </p>
      </section>
    );
  }

  if (!product.can_reserve || !product.variants.length) {
    return (
      <section id="reserve" className="rounded-lg border border-stone-200 bg-stone-100 p-6">
        <h2 className="font-serif text-2xl font-semibold text-stone-950">{isEnglish ? "Gallery pickup" : "Взимане от галерията"}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-650">{isEnglish ? "Requests for this product are temporarily unavailable." : "Заявките за този продукт временно не са активни."}</p>
      </section>
    );
  }

  return (
    <form id="reserve" action={createGalleryReservationAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="product_slug" value={product.slug} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <header>
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Reserve" : "Заяви"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{isEnglish ? "Pick up from the gallery" : "Вземи от галерията"}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-650">{isEnglish ? "Choose any type and size. Available items can be reserved immediately; the rest are sent as a product request. Payment is made at the gallery." : "Избери произволен вид и размер. Наличните артикули се резервират, а останалите се изпращат като заявка за продукт. Плащането е в галерията."}</p>
      </header>

      {availableVariants.length ? (
        <section className="grid gap-3 rounded-lg border border-forest/15 bg-sage/35 p-4" aria-labelledby="available-now-heading">
          <div>
            <h3 id="available-now-heading" className="font-semibold text-stone-950">{isEnglish ? "Available now in the gallery" : "Налично сега в галерията"}</h3>
            <p className="mt-1 text-xs leading-5 text-stone-600">{isEnglish ? "Choose a specific available type and size." : "Избери конкретен наличен вид и размер."}</p>
          </div>
          <div className="grid gap-2">
            {availableVariants.map((variant) => (
              <button key={variant.id} type="button" onClick={() => chooseAvailableVariant(variant.id)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-stone-900 transition hover:border-forest hover:bg-stone-50 hover:text-stone-950">
                <span><strong className="block text-sm">{[variant.product_type ? typeName(variant.product_type.name) : null, variant.label].filter(Boolean).join(" · ")}</strong><small className="text-stone-600">{isEnglish ? `${variant.quantity_available} available` : `${variant.quantity_available} бр. налични`}</small></span>
                <span className="shrink-0 text-xs font-semibold text-forest">{isEnglish ? "Reserve" : "Заяви"}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-stone-200 bg-stone-100 p-4 text-sm leading-6 text-stone-650">
          {isEnglish ? "There is no ready stock in the gallery, but you can request any type and size below." : "В момента няма готова наличност в галерията, но можеш да заявиш всеки вид и размер по-долу."}
        </p>
      )}

      <div id="request-fields" className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          {isEnglish ? "Product type" : "Вид продукт"}
          <select name="product_type_id" required className={fieldClass} value={selectedTypeId} onChange={(event) => chooseType(event.target.value)}>
            {productTypes.map((type) => <option key={type.id} value={type.id}>{typeName(type.name)}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          {isEnglish ? "Size / variant" : "Размер / вариант"}
          <select name="variant_id" required className={fieldClass} value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)}>
            {variantsForType.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label} {variant.quantity_available > 0
                  ? (isEnglish ? `(${variant.quantity_available} available)` : `(${variant.quantity_available} налични)`)
                  : (isEnglish ? "(by request)" : "(по заявка)")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800 sm:col-span-2">
          {isEnglish ? "Quantity" : "Количество"}
          <select name="quantity" required className={fieldClass} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
            {Array.from({ length: 20 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Name" : "Име"}
        <input name="customer_name" required autoComplete="name" maxLength={120} className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Phone" : "Телефон"}
        <input name="customer_phone" type="tel" required autoComplete="tel" maxLength={60} className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        Email
        <input name="customer_email" type="email" required autoComplete="email" maxLength={180} className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Note (optional)" : "Бележка (по желание)"}
        <textarea name="note" rows={3} maxLength={1200} className={fieldClass} placeholder={isEnglish ? "For example, preferred pickup day" : "Например предпочитан ден за взимане"} />
      </label>
      <label className="choice-row text-sm leading-6 text-stone-650">
        <input type="checkbox" name="accept_terms" required className="choice-control" />
        <span>{isEnglish ? "I accept the" : "Приемам"} <Link href={localePath(locale, "/terms")} className="font-semibold text-forest underline">{isEnglish ? "terms" : "условията"}</Link> {isEnglish ? "and" : "и"} <Link href={localePath(locale, "/privacy")} className="font-semibold text-forest underline">{isEnglish ? "privacy policy" : "политиката за поверителност"}</Link>.</span>
      </label>
      {reservationError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {isEnglish ? "The request could not be saved. Check the fields or try again." : "Заявката не можа да бъде записана. Провери полетата или опитай отново."}
        </p>
      ) : null}
      <button className="admin-button admin-button-forest w-full px-6 py-4 text-base font-semibold">
        {selectedFromStock
          ? (isEnglish ? "Reserve selected stock" : "Заяви избраната наличност")
          : (isEnglish ? "Send product request" : "Изпрати заявка за продукта")}
      </button>
    </form>
  );
}
