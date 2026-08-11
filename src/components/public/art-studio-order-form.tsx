"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createArtStudioOrderAction } from "@/app/(site)/[locale]/art-studio/actions";
import { localePath } from "@/lib/i18n";
import type { ArtStudioPublicSettings, Locale, LocalizedArtStudioProduct } from "@/lib/types";

const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

function money(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", { style: "currency", currency }).format(value);
}

export function ArtStudioOrderForm({
  product,
  settings,
  locale,
  orderError
}: {
  product: LocalizedArtStudioProduct;
  settings: ArtStudioPublicSettings;
  locale: Locale;
  orderError?: string | null;
}) {
  const availableOffers = product.offers.filter((offer) => offer.is_active && offer.payment_link_url);
  const [offerId, setOfferId] = useState(availableOffers[0]?.id || "");
  const [deliveryMethod, setDeliveryMethod] = useState<"econt_office" | "gallery_pickup">("gallery_pickup");
  const offer = useMemo(() => availableOffers.find((item) => item.id === offerId) || availableOffers[0], [availableOffers, offerId]);
  const total = offer ? Number(offer.price) : 0;
  const isEnglish = locale === "en";
  const pickupName = isEnglish ? settings.pickup_name_en || settings.pickup_name_bg : settings.pickup_name_bg;
  const pickupAddress = isEnglish ? settings.pickup_address_en || settings.pickup_address_bg : settings.pickup_address_bg;
  const pickupInstructions = isEnglish ? settings.pickup_instructions_en || settings.pickup_instructions_bg : settings.pickup_instructions_bg;
  const econtInstructions = isEnglish ? settings.econt_instructions_en || settings.econt_instructions_bg : settings.econt_instructions_bg;

  if (!settings.orders_enabled || !availableOffers.length) {
    return (
      <div id="order" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Ordering" : "Поръчка"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">{isEnglish ? "Available soon" : "Очаквайте скоро"}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-650">{isEnglish ? "Online payment for this product is being prepared." : "Онлайн плащането за този продукт се подготвя."}</p>
        <Link href={localePath(locale, "/contact")} className="mt-5 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss hover:text-white">
          {isEnglish ? "Send an enquiry" : "Изпрати запитване"}
        </Link>
      </div>
    );
  }

  return (
    <form id="order" action={createArtStudioOrderAction} className="grid gap-7 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-7">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="type_slug" value={product.product_type.slug} />
      <input type="hidden" name="product_slug" value={product.slug} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <header>
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Order" : "Поръчай"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{product.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-650">{isEnglish ? "Complete the details and continue to secure Stripe payment." : "Попълни данните и продължи към сигурно плащане със Stripe."}</p>
      </header>

      <fieldset className="grid gap-3 border-t border-stone-200 pt-5">
        <legend className="font-semibold text-stone-950">{isEnglish ? "Price option" : "Размер / ценови вариант"}</legend>
        {availableOffers.map((item) => (
          <label key={item.id} className={`grid cursor-pointer grid-cols-[1.25rem_1fr_auto] items-start gap-3 rounded-xl border p-4 transition ${offerId === item.id ? "border-forest bg-sage/40" : "border-stone-200 hover:border-moss"}`}>
            <input type="radio" name="offer_id" value={item.id} checked={offerId === item.id} onChange={() => setOfferId(item.id)} className="choice-control" />
            <span className="font-semibold text-stone-900">{isEnglish ? item.label_en || item.label_bg : item.label_bg}</span>
            <strong className="text-forest">{money(Number(item.price), item.currency, locale)}</strong>
          </label>
        ))}
      </fieldset>

      {product.options.map((option) => (
        <fieldset key={option.id} className="grid gap-3 border-t border-stone-200 pt-5">
          <legend className="font-semibold text-stone-950">{isEnglish ? option.label_en || option.label_bg : option.label_bg}</legend>
          {option.input_type === "select" ? (
            <select name={`option_${option.option_key}`} required={option.is_required} className={fieldClass} defaultValue="">
              <option value="" disabled>{isEnglish ? "Choose" : "Избери"}</option>
              {option.values.map((value) => <option key={value.value} value={value.value}>{isEnglish ? value.label_en || value.label_bg : value.label_bg}</option>)}
            </select>
          ) : (
            <div className="flex flex-wrap gap-3">
              {option.values.map((value, index) => (
                <label key={value.value} className="group cursor-pointer">
                  <input type="radio" name={`option_${option.option_key}`} value={value.value} required={option.is_required} defaultChecked={index === 0 && option.is_required} className="peer sr-only" />
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-forest peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-forest">
                    {option.input_type === "swatch" ? <span className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: value.hex_color || "#ffffff" }} aria-hidden="true" /> : null}
                    {isEnglish ? value.label_en || value.label_bg : value.label_bg}
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ))}

      {product.personalization_text_enabled || product.idea_note_enabled ? (
        <fieldset className="grid gap-4 border-t border-stone-200 pt-5">
          <legend className="font-semibold text-stone-950">{isEnglish ? "Optional note" : "Допълнение по желание"}</legend>
          {product.personalization_text_enabled ? (
            <label className="grid gap-2 text-sm font-semibold text-stone-800">{isEnglish ? "Name or text" : "Име или текст"}
              <input name="personalization_text" maxLength={240} className={fieldClass} placeholder={isEnglish ? "For example: LEO" : "Например: LEO"} />
            </label>
          ) : null}
          {product.idea_note_enabled ? (
            <label className="grid gap-2 text-sm font-semibold text-stone-800">{isEnglish ? "Idea or note" : "Идея или бележка"}
              <textarea name="idea_note" maxLength={2000} rows={4} className={fieldClass} placeholder={isEnglish ? "Describe the requested text or small adjustment." : "Опиши желания текст или малка промяна."} />
            </label>
          ) : null}
        </fieldset>
      ) : null}

      <fieldset className="grid gap-4 border-t border-stone-200 pt-5">
        <legend className="font-semibold text-stone-950">{isEnglish ? "Contact details" : "Данни за контакт"}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "First name" : "Име"}<input name="first_name" required autoComplete="given-name" className={fieldClass} /></label>
          <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Last name" : "Фамилия"}<input name="last_name" required autoComplete="family-name" className={fieldClass} /></label>
          <label className="grid gap-2 text-sm font-semibold">Email<input name="email" type="email" required autoComplete="email" className={fieldClass} /></label>
          <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Phone" : "Телефон"}<input name="phone" type="tel" required autoComplete="tel" className={fieldClass} /></label>
        </div>
      </fieldset>

      <fieldset className="grid gap-3 border-t border-stone-200 pt-5">
        <legend className="font-semibold text-stone-950">{isEnglish ? "Delivery" : "Получаване"}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`choice-row cursor-pointer rounded-xl border p-4 ${deliveryMethod === "gallery_pickup" ? "border-forest bg-sage/40" : "border-stone-200"}`}>
            <input type="radio" name="delivery_method" value="gallery_pickup" checked={deliveryMethod === "gallery_pickup"} onChange={() => setDeliveryMethod("gallery_pickup")} className="choice-control" />
            <span><strong className="block">{isEnglish ? "Gallery pickup" : "Взимане от галерията"}</strong><small className="mt-1 block text-stone-600">{pickupName}</small></span>
          </label>
          <label className={`choice-row cursor-pointer rounded-xl border p-4 ${deliveryMethod === "econt_office" ? "border-forest bg-sage/40" : "border-stone-200"}`}>
            <input type="radio" name="delivery_method" value="econt_office" checked={deliveryMethod === "econt_office"} onChange={() => setDeliveryMethod("econt_office")} className="choice-control" />
            <span><strong className="block">{isEnglish ? "Econt office" : "До офис на Еконт"}</strong><small className="mt-1 block text-stone-600">{isEnglish ? "Prepaid order" : "Предплатена поръчка"}</small></span>
          </label>
        </div>
        {deliveryMethod === "gallery_pickup" ? (
          <div className="rounded-xl bg-stone-100 p-4 text-sm leading-6 text-stone-700">
            <strong>{pickupName}</strong>{pickupAddress ? <span className="block">{pickupAddress}</span> : null}{settings.pickup_phone ? <span className="block">{settings.pickup_phone}</span> : null}{pickupInstructions ? <span className="mt-1 block">{pickupInstructions}</span> : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm text-stone-600">{econtInstructions}</p>
            <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "City" : "Град"}<input name="delivery_city" required className={fieldClass} /></label>
            <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Econt office" : "Офис на Еконт"}<input name="delivery_office" required className={fieldClass} placeholder={isEnglish ? "Office name or address" : "Име или адрес на офиса"} /></label>
          </div>
        )}
        <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Delivery note" : "Бележка за получаването"}<textarea name="delivery_notes" rows={2} className={fieldClass} /></label>
      </fieldset>

      <div className="grid gap-3 border-t border-stone-200 pt-5">
        <div className="rounded-xl bg-stone-950 p-4 text-white">
          <div className="flex items-center justify-between gap-4 text-lg"><span>{isEnglish ? "Product total" : "Общо за продукта"}</span><strong>{offer ? money(total, offer.currency, locale) : "—"}</strong></div>
          <p className="mt-2 text-xs leading-5 text-stone-300">
            {deliveryMethod === "gallery_pickup"
              ? (isEnglish ? "Gallery pickup has no delivery fee." : "Взимането от галерията е без такса за доставка.")
              : (isEnglish ? "The Econt delivery fee is calculated separately according to the courier tariff." : "Таксата за доставка с Еконт се изчислява отделно според тарифата на куриера.")}
          </p>
        </div>
      </div>

      <label className="choice-row text-sm leading-6 text-stone-650">
        <input type="checkbox" name="accept_terms" required className="choice-control" />
        <span>{isEnglish ? "I accept the" : "Приемам"} <Link href={localePath(locale, "/terms")} className="font-semibold text-forest underline">{isEnglish ? "terms" : "условията"}</Link> {isEnglish ? "and" : "и"} <Link href={localePath(locale, "/privacy")} className="font-semibold text-forest underline">{isEnglish ? "privacy policy" : "политиката за поверителност"}</Link>.</span>
      </label>

      {orderError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{isEnglish ? "The order could not be started. Check all fields or contact us." : "Поръчката не можа да бъде започната. Провери полетата или се свържи с нас."}</p> : null}
      <button className="admin-button admin-button-forest w-full px-6 py-4 text-base font-semibold">{isEnglish ? "Continue to secure payment" : "Продължи към сигурно плащане"}</button>
      <p className="text-center text-xs leading-5 text-stone-500">{isEnglish ? "Prepayment only. Payment is completed securely on Stripe." : "Само с предварително плащане. Плащането се извършва сигурно в Stripe."}</p>
    </form>
  );
}
