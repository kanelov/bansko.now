"use client";

import Link from "next/link";
import { useState } from "react";
import { submitArtStudioEnquiryAction } from "@/app/(site)/[locale]/art-studio/actions";
import { fieldLabel, normalizeFormConfig, optionLabel, photoLabel } from "@/lib/art-studio-forms";
import { localePath } from "@/lib/i18n";
import type { ArtStudioPublicSettings, Locale, LocalizedArtStudioProduct, LocalizedArtStudioProductType } from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

function money(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", { style: "currency", currency }).format(value);
}

/**
 * Enquiry-style order form. The owner receives the details by email and confirms
 * price and timing; nothing is charged here.
 */
export function ArtStudioEnquiryForm({
  productType,
  product = null,
  settings,
  locale
}: {
  productType: LocalizedArtStudioProductType;
  product?: LocalizedArtStudioProduct | null;
  settings: ArtStudioPublicSettings;
  locale: Locale;
}) {
  const isEnglish = locale === "en";
  const config = normalizeFormConfig(productType.form_config);
  const offers = (product?.offers ?? []).filter((offer) => offer.is_active);
  const [offerId, setOfferId] = useState(offers[0]?.id || "");
  const [deliveryMethod, setDeliveryMethod] = useState<"econt_office" | "gallery_pickup">("gallery_pickup");
  const [fileName, setFileName] = useState("");
  const pickupName = isEnglish ? settings.pickup_name_en || settings.pickup_name_bg : settings.pickup_name_bg;
  const pickupAddress = isEnglish ? settings.pickup_address_en || settings.pickup_address_bg : settings.pickup_address_bg;
  const pickupInstructions = isEnglish ? settings.pickup_instructions_en || settings.pickup_instructions_bg : settings.pickup_instructions_bg;
  const econtInstructions = isEnglish ? settings.econt_instructions_en || settings.econt_instructions_bg : settings.econt_instructions_bg;
  const showPersonalization = product ? product.personalization_text_enabled : true;
  const title = product?.title || productType.title;

  return (
    <form id="order" action={submitArtStudioEnquiryAction} className="grid gap-7 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-7">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="product_type_id" value={productType.id} />
      {product ? <input type="hidden" name="product_id" value={product.id} /> : null}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <header>
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Order" : "Поръчай"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-650">
          {isEnglish
            ? "Choose your options and leave your details. We confirm the price, timing and pickup by phone or email. No payment now."
            : "Избери опциите и остави данните си. Потвърждаваме цена, срок и получаване по телефон или имейл. Без плащане сега."}
        </p>
      </header>

      {offers.length ? (
        <fieldset className="grid gap-3 border-t border-stone-200 pt-5">
          <legend className="font-semibold text-stone-950">{isEnglish ? "Price option" : "Ценови вариант"}</legend>
          {offers.map((offer) => (
            <label
              key={offer.id}
              className={`grid cursor-pointer grid-cols-[1.25rem_1fr_auto] items-start gap-3 rounded-xl border p-4 transition ${offerId === offer.id ? "border-forest bg-sage/40" : "border-stone-200 hover:border-moss"}`}
            >
              <input type="radio" name="offer_id" value={offer.id} checked={offerId === offer.id} onChange={() => setOfferId(offer.id)} className="choice-control" />
              <span className="font-semibold text-stone-900">{isEnglish ? offer.label_en || offer.label_bg : offer.label_bg}</span>
              <strong className="text-forest">{money(Number(offer.price), offer.currency, locale)}</strong>
            </label>
          ))}
        </fieldset>
      ) : null}

      {config.fields.length || product?.options.length ? (
        <fieldset className="grid gap-4 border-t border-stone-200 pt-5">
          <legend className="font-semibold text-stone-950">{isEnglish ? "Options" : "Опции"}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((field) => (
              <label key={field.key} className="grid gap-2 text-sm font-semibold text-stone-800">
                {fieldLabel(field, locale)}
                {field.required ? <span className="sr-only">*</span> : null}
                <select name={`field_${field.key}`} required={field.required} defaultValue="" className={fieldClass}>
                  <option value="" disabled={field.required}>
                    {isEnglish ? (field.required ? "Choose" : "Not selected") : field.required ? "Избери" : "Без избор"}
                  </option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {optionLabel(option, locale)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            {(product?.options ?? []).map((option) => (
              <label key={option.id} className="grid gap-2 text-sm font-semibold text-stone-800">
                {isEnglish ? option.label_en || option.label_bg : option.label_bg}
                <select name={`option_${option.option_key}`} required={option.is_required} defaultValue="" className={fieldClass}>
                  <option value="" disabled={option.is_required}>
                    {isEnglish ? "Choose" : "Избери"}
                  </option>
                  {option.values.map((value) => (
                    <option key={value.value} value={value.value}>
                      {isEnglish ? value.label_en || value.label_bg : value.label_bg}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="grid gap-4 border-t border-stone-200 pt-5">
        <legend className="font-semibold text-stone-950">{isEnglish ? "Your order" : "Твоята поръчка"}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {config.quantity ? (
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              {isEnglish ? "Quantity" : "Брой"}
              <input name="quantity" type="number" min={1} max={20} defaultValue={1} className={fieldClass} />
            </label>
          ) : null}
          {showPersonalization ? (
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              {isEnglish ? "Name or text on the product" : "Име или текст върху продукта"}
              <input name="personalization_text" maxLength={240} className={fieldClass} placeholder={isEnglish ? "Optional" : "По желание"} />
            </label>
          ) : null}
        </div>
        {config.photo_upload !== "none" ? (
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {photoLabel(config, locale)}
            <input
              name="attachment"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              required={config.photo_upload === "required"}
              onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
              className="block w-full rounded-xl border border-dashed border-stone-300 bg-paper px-4 py-3 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <span className="text-xs font-normal text-stone-500">
              {fileName || (isEnglish ? "JPG, PNG, WebP, HEIC or PDF up to 15 MB." : "JPG, PNG, WebP, HEIC или PDF до 15 MB.")}
            </span>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          {isEnglish ? "Message or idea" : "Съобщение или идея"}
          <textarea
            name="message"
            rows={4}
            maxLength={2000}
            className={fieldClass}
            placeholder={isEnglish ? "Colours, deadline, a gift for whom, anything that helps us." : "Цветове, срок, за кого е подаръкът, всичко, което ще ни помогне."}
          />
        </label>
      </fieldset>

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
        <legend className="font-semibold text-stone-950">{isEnglish ? "Pickup or delivery" : "Получаване"}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`choice-row cursor-pointer rounded-xl border p-4 ${deliveryMethod === "gallery_pickup" ? "border-forest bg-sage/40" : "border-stone-200"}`}>
            <input type="radio" name="delivery_method" value="gallery_pickup" checked={deliveryMethod === "gallery_pickup"} onChange={() => setDeliveryMethod("gallery_pickup")} className="choice-control" />
            <span><strong className="block">{isEnglish ? "Gallery pickup" : "Взимане от галерията"}</strong><small className="mt-1 block text-stone-600">{pickupName}</small></span>
          </label>
          <label className={`choice-row cursor-pointer rounded-xl border p-4 ${deliveryMethod === "econt_office" ? "border-forest bg-sage/40" : "border-stone-200"}`}>
            <input type="radio" name="delivery_method" value="econt_office" checked={deliveryMethod === "econt_office"} onChange={() => setDeliveryMethod("econt_office")} className="choice-control" />
            <span><strong className="block">{isEnglish ? "Econt office" : "До офис на Еконт"}</strong><small className="mt-1 block text-stone-600">{isEnglish ? "Delivery fee by the courier tariff" : "Такса по тарифата на куриера"}</small></span>
          </label>
        </div>
        {deliveryMethod === "gallery_pickup" ? (
          <div className="rounded-xl bg-stone-100 p-4 text-sm leading-6 text-stone-700">
            <strong>{pickupName}</strong>
            {pickupAddress ? <span className="block">{pickupAddress}</span> : null}
            {settings.pickup_phone ? <span className="block">{settings.pickup_phone}</span> : null}
            {pickupInstructions ? <span className="mt-1 block">{pickupInstructions}</span> : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {econtInstructions ? <p className="text-sm text-stone-600 sm:col-span-2">{econtInstructions}</p> : null}
            <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "City" : "Град"}<input name="delivery_city" required className={fieldClass} /></label>
            <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Econt office" : "Офис на Еконт"}<input name="delivery_office" required className={fieldClass} placeholder={isEnglish ? "Office name or address" : "Име или адрес на офиса"} /></label>
          </div>
        )}
        <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Note for pickup or delivery" : "Бележка за получаването"}<textarea name="delivery_notes" rows={2} className={fieldClass} /></label>
      </fieldset>

      <label className="choice-row text-sm leading-6 text-stone-650">
        <input type="checkbox" name="accept_terms" required className="choice-control" />
        <span>
          {isEnglish ? "I accept the" : "Приемам"} <Link href={localePath(locale, "/terms")} className="font-semibold text-forest underline">{isEnglish ? "terms" : "условията"}</Link> {isEnglish ? "and" : "и"}{" "}
          <Link href={localePath(locale, "/privacy")} className="font-semibold text-forest underline">{isEnglish ? "privacy policy" : "политиката за поверителност"}</Link>.
        </span>
      </label>

      <button className="admin-button admin-button-forest w-full px-6 py-4 text-base font-semibold">{isEnglish ? "Send the order" : "Изпрати поръчката"}</button>
      <p className="text-center text-xs leading-5 text-stone-500">
        {isEnglish ? "You receive a confirmation email right away and we call or write back to agree the details." : "Получаваш потвърждение по имейл веднага, а ние се обаждаме или пишем, за да уточним детайлите."}
      </p>
    </form>
  );
}
