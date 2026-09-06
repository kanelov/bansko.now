"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { submitArtStudioEnquiryAction } from "@/app/(site)/[locale]/art-studio/actions";
import {
  displayVariantLabels,
  fieldIsVisible,
  fieldLabel,
  normalizeFormConfig,
  optionLabel,
  photoLabel,
  sourceGroupLabel,
  sourceModelLabel,
  sourceSizeLabel,
  visibleFields,
  visibleOptions
} from "@/lib/art-studio-forms";
import type { SelectedGalleryDesign } from "@/lib/art-studio-gallery-types";
import { localePath } from "@/lib/i18n";
import type { ArtStudioPublicSettings, Locale, LocalizedArtStudioProduct, LocalizedArtStudioProductType, SourceVariantGroup } from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";
const chipClass =
  "inline-flex h-10 min-w-[3.5rem] cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-moss peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sage peer-focus-visible:ring-offset-1";

function money(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", { style: "currency", currency }).format(value);
}

/** Pill-style radio option, optionally with a colour swatch. The input stays in the DOM for native validation. */
function Chip({
  name,
  value,
  label,
  checked,
  required,
  swatch,
  onChange
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  required?: boolean;
  swatch?: string | null;
  onChange: () => void;
}) {
  return (
    <label>
      <input type="radio" name={name} value={value} checked={checked} required={required} onChange={onChange} className="peer sr-only" />
      <span className={chipClass}>
        {swatch ? <span aria-hidden="true" className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/15 shadow-inner" style={{ backgroundColor: swatch }} /> : null}
        {label}
      </span>
    </label>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id} className="grid gap-2.5">
      <p id={id} className="text-sm font-semibold text-stone-800">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * Enquiry-style order form. Sizes come from the request app catalog when configured
 * (sourceGroups), otherwise from the static form_config. The owner receives the details
 * by email and confirms price and timing; nothing is charged here.
 */

const subscribeToNothing = () => () => {};

function readPhotoSlugFromUrl() {
  const value = new URLSearchParams(window.location.search).get("photo") || "";
  return /^[a-z0-9-]{1,160}$/i.test(value) ? value : "";
}

export function ArtStudioEnquiryForm({
  productType,
  product = null,
  settings,
  locale,
  sourceGroups = [],
  formCopy,
  galleryDesign = null,
  onClearGalleryDesign
}: {
  productType: LocalizedArtStudioProductType;
  product?: LocalizedArtStudioProduct | null;
  settings: ArtStudioPublicSettings;
  locale: Locale;
  sourceGroups?: SourceVariantGroup[];
  /** Editable texts from the admin "Текстове" tab; defaults below. */
  formCopy?: { eyebrow?: string; intro?: string; button?: string };
  /** Optional ready design chosen in the gallery picker; only its id is sent, the server re-validates. */
  galleryDesign?: SelectedGalleryDesign | null;
  onClearGalleryDesign?: () => void;
}) {
  const isEnglish = locale === "en";
  const config = normalizeFormConfig(productType.form_config);
  const sourceSizes = config.source_sizes;
  const sourceActive = Boolean(sourceSizes) && sourceGroups.length > 0;
  const singleVariant = sourceGroups.length === 1 && sourceGroups[0].variants.length === 1 ? sourceGroups[0].variants[0] : null;
  const fields = visibleFields(config, sourceActive);
  const offers = (product?.offers ?? []).filter((offer) => offer.is_active);

  const [offerId, setOfferId] = useState(offers[0]?.id || "");
  const [sourceTypeId, setSourceTypeId] = useState(sourceGroups[0]?.id || "");
  const [sourceVariantId, setSourceVariantId] = useState(singleVariant?.id || "");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<"econt_office" | "gallery_pickup">("gallery_pickup");
  const [fileName, setFileName] = useState("");
  // The photo archive links here with ?photo=<slug>. The page itself stays cached, so the
  // browser hands the slug to the form instead of the server reading the query string.
  const photoSlug = useSyncExternalStore(subscribeToNothing, readPhotoSlugFromUrl, () => "");

  const activeGroup = sourceGroups.find((group) => group.id === sourceTypeId) ?? sourceGroups[0] ?? null;
  const sizeLabels = activeGroup ? displayVariantLabels(activeGroup) : {};
  const pickupName = isEnglish ? settings.pickup_name_en || settings.pickup_name_bg : settings.pickup_name_bg;
  const pickupAddress = isEnglish ? settings.pickup_address_en || settings.pickup_address_bg : settings.pickup_address_bg;
  const pickupInstructions = isEnglish ? settings.pickup_instructions_en || settings.pickup_instructions_bg : settings.pickup_instructions_bg;
  const econtInstructions = isEnglish ? settings.econt_instructions_en || settings.econt_instructions_bg : settings.econt_instructions_bg;
  const showPersonalization = product ? product.personalization_text_enabled : true;
  const title = product?.title || productType.title;
  const chooseLabel = isEnglish ? "Choose" : "Избери";
  const hasOptions = sourceActive || fields.length > 0 || (product?.options.length ?? 0) > 0;

  function choose(key: string, value: string) {
    setSelected((current) => ({ ...current, [key]: value }));
  }

  return (
    <form id="order" action={submitArtStudioEnquiryAction} className="grid gap-7 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-7">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="product_type_id" value={productType.id} />
      {product ? <input type="hidden" name="product_id" value={product.id} /> : null}
      {galleryDesign ? <input type="hidden" name="gallery_design_id" value={galleryDesign.id} /> : null}
      {photoSlug ? <input type="hidden" name="photo_slug" value={photoSlug} /> : null}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <header>
        <p className="text-sm font-semibold uppercase text-moss">{formCopy?.eyebrow || (isEnglish ? "Order" : "Поръчай")}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-650">
          {formCopy?.intro ||
            (isEnglish
              ? "Choose your options and leave your details. We confirm the price, timing and pickup by phone or email. No payment now."
              : "Избери опциите и остави данните си. Потвърждаваме цена, срок и получаване по телефон или имейл. Без плащане сега.")}
        </p>
        {galleryDesign ? (
          <p className="mt-3 flex items-center gap-3 rounded-xl border border-forest/30 bg-sage/30 px-3 py-2 text-sm" aria-live="polite">
            {galleryDesign.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
              <img src={galleryDesign.image_url} alt="" width={80} height={80} className="h-10 w-10 shrink-0 rounded-lg border border-stone-200 object-cover" />
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase text-moss">{isEnglish ? "Gallery design" : "Дизайн от галерията"}</span>
              <span className="block truncate font-semibold text-stone-950">{galleryDesign.title}</span>
            </span>
            {onClearGalleryDesign ? (
              <button type="button" onClick={onClearGalleryDesign} className="shrink-0 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:underline">
                {isEnglish ? "Use my own design" : "Използвай собствен дизайн"}
              </button>
            ) : null}
          </p>
        ) : null}
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

      {hasOptions ? (
        <div className="grid gap-6 border-t border-stone-200 pt-5">
          <p className="font-semibold text-stone-950">{isEnglish ? "Options" : "Опции"}</p>

          {sourceActive && sourceSizes ? (
            <>
              {sourceGroups.length > 1 ? (
                <ChipGroup label={sourceModelLabel(sourceSizes, locale)}>
                  {sourceGroups.map((group) => (
                    <Chip
                      key={group.id}
                      name="source_type_id"
                      value={group.id}
                      label={sourceGroupLabel(group, sourceSizes, locale)}
                      checked={activeGroup?.id === group.id}
                      required={sourceSizes.required}
                      onChange={() => {
                        setSourceTypeId(group.id);
                        setSourceVariantId("");
                      }}
                    />
                  ))}
                </ChipGroup>
              ) : (
                <input type="hidden" name="source_type_id" value={activeGroup?.id || ""} />
              )}
              {singleVariant ? (
                <input type="hidden" name="source_variant_id" value={singleVariant.id} />
              ) : activeGroup ? (
                <ChipGroup label={sourceSizeLabel(sourceSizes, locale)}>
                  {activeGroup.variants.map((variant) => (
                    <Chip
                      key={variant.id}
                      name="source_variant_id"
                      value={variant.id}
                      label={sizeLabels[variant.id] || variant.label}
                      checked={sourceVariantId === variant.id}
                      required={sourceSizes.required}
                      onChange={() => setSourceVariantId(variant.id)}
                    />
                  ))}
                </ChipGroup>
              ) : null}
            </>
          ) : null}

          {fields.filter((field) => fieldIsVisible(field, selected)).map((field) => {
            const options = visibleOptions(field, selected);
            const current = options.some((option) => option.value === selected[field.key]) ? selected[field.key] : "";
            const name = `field_${field.key}`;
            if (field.display === "select" || options.length > 12) {
              return (
                <label key={field.key} className="grid gap-2.5 text-sm font-semibold text-stone-800">
                  {fieldLabel(field, locale)}
                  <select name={name} required={field.required} value={current} onChange={(event) => choose(field.key, event.target.value)} className={fieldClass}>
                    <option value="" disabled={field.required}>
                      {isEnglish ? (field.required ? "Choose" : "Not selected") : field.required ? "Избери" : "Без избор"}
                    </option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {optionLabel(option, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            return (
              <ChipGroup key={field.key} label={fieldLabel(field, locale)}>
                {options.map((option) => (
                  <Chip
                    key={option.value}
                    name={name}
                    value={option.value}
                    label={optionLabel(option, locale)}
                    checked={current === option.value}
                    required={field.required}
                    swatch={option.swatch}
                    onChange={() => choose(field.key, option.value)}
                  />
                ))}
              </ChipGroup>
            );
          })}

          {(product?.options ?? []).map((option) => {
            const key = `opt:${option.option_key}`;
            const name = `option_${option.option_key}`;
            const label = isEnglish ? option.label_en || option.label_bg : option.label_bg;
            if (option.values.length > 12) {
              return (
                <label key={option.id} className="grid gap-2.5 text-sm font-semibold text-stone-800">
                  {label}
                  <select name={name} required={option.is_required} value={selected[key] ?? ""} onChange={(event) => choose(key, event.target.value)} className={fieldClass}>
                    <option value="" disabled={option.is_required}>{chooseLabel}</option>
                    {option.values.map((value) => (
                      <option key={value.value} value={value.value}>
                        {isEnglish ? value.label_en || value.label_bg : value.label_bg}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            return (
              <ChipGroup key={option.id} label={label}>
                {option.values.map((value) => (
                  <Chip
                    key={value.value}
                    name={name}
                    value={value.value}
                    label={isEnglish ? value.label_en || value.label_bg : value.label_bg}
                    checked={(selected[key] ?? "") === value.value}
                    required={option.is_required}
                    onChange={() => choose(key, value.value)}
                  />
                ))}
              </ChipGroup>
            );
          })}
        </div>
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
            <span><strong className="block">{isEnglish ? "Econt office or locker" : "До офис или автомат на Еконт"}</strong><small className="mt-1 block text-stone-600">{isEnglish ? "Delivery fee by the courier tariff" : "Такса по тарифата на куриера"}</small></span>
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
            <label className="grid gap-2 text-sm font-semibold">
              {isEnglish ? "Econt office or locker" : "Офис или автомат на Еконт"}
              <input name="delivery_office" required className={fieldClass} placeholder={isEnglish ? "Office or locker name / address" : "Име или адрес на офиса или автомата"} />
            </label>
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

      <button className="admin-button admin-button-forest w-full px-6 py-4 text-base font-semibold">{formCopy?.button || (isEnglish ? "Send the order" : "Изпрати поръчката")}</button>
      <p className="text-center text-xs leading-5 text-stone-500">
        {isEnglish ? "You receive a confirmation email right away and we call or write back to agree the details." : "Получаваш потвърждение по имейл веднага, а ние се обаждаме или пишем, за да уточним детайлите."}
      </p>
    </form>
  );
}
