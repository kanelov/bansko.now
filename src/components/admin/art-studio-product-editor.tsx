"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { archiveArtStudioProductAction, upsertArtStudioProductAction } from "@/app/admin/art-studio-actions";
import type {
  ArtStudioOptionValue,
  ArtStudioProductOffer,
  ArtStudioProductOption,
  LocalizedArtStudioCategory,
  LocalizedArtStudioProduct,
  LocalizedArtStudioProductType
} from "@/lib/types";

type DraftValue = ArtStudioOptionValue & { row_id: string };
type DraftOption = Omit<ArtStudioProductOption, "id" | "product_id" | "created_at" | "updated_at" | "values"> & {
  row_id: string;
  values: DraftValue[];
};
type DraftOffer = Omit<ArtStudioProductOffer, "id" | "product_id" | "created_at" | "updated_at"> & { row_id: string };

const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";
const labelClass = "grid gap-2 text-sm font-semibold text-stone-800";

function rowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function initialOptions(product: LocalizedArtStudioProduct | null): DraftOption[] {
  return (product?.options ?? []).map((option) => ({
    option_key: option.option_key,
    label_bg: option.label_bg,
    label_en: option.label_en,
    input_type: option.input_type,
    is_required: option.is_required,
    sort_order: option.sort_order,
    row_id: option.id,
    values: option.values.map((value, index) => ({ ...value, row_id: `${option.id}-${index}` }))
  }));
}

function initialOffers(product: LocalizedArtStudioProduct | null): DraftOffer[] {
  return (product?.offers ?? []).map((offer) => ({
    label_bg: offer.label_bg,
    label_en: offer.label_en,
    price: Number(offer.price),
    currency: offer.currency,
    payment_link_url: offer.payment_link_url,
    is_active: offer.is_active,
    sort_order: offer.sort_order,
    row_id: offer.id
  }));
}

export function ArtStudioProductEditor({
  product,
  englishProduct,
  productTypes,
  categories
}: {
  product: LocalizedArtStudioProduct | null;
  englishProduct: LocalizedArtStudioProduct | null;
  productTypes: LocalizedArtStudioProductType[];
  categories: LocalizedArtStudioCategory[];
}) {
  const [productTypeId, setProductTypeId] = useState(product?.product_type_id || productTypes[0]?.id || "");
  const [options, setOptions] = useState<DraftOption[]>(() => initialOptions(product));
  const [offers, setOffers] = useState<DraftOffer[]>(() => initialOffers(product));
  const availableCategories = useMemo(
    () => categories.filter((category) => category.product_type_id === productTypeId),
    [categories, productTypeId]
  );

  const addOption = () => setOptions((items) => [
    ...items,
    {
      row_id: rowId("option"),
      option_key: "",
      label_bg: "",
      label_en: "",
      input_type: "select",
      is_required: true,
      sort_order: items.length * 10,
      values: []
    }
  ]);

  const addValue = (optionRowId: string) => setOptions((items) => items.map((option) =>
    option.row_id === optionRowId
      ? { ...option, values: [...option.values, { row_id: rowId("value"), value: "", label_bg: "", label_en: "", hex_color: null }] }
      : option
  ));

  const addOffer = () => setOffers((items) => [
    ...items,
    {
      row_id: rowId("offer"),
      label_bg: "",
      label_en: "",
      price: 0,
      currency: "EUR",
      payment_link_url: null,
      is_active: true,
      sort_order: items.length * 10
    }
  ]);

  return (
    <details className="rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-5" open={!product}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">{product ? product.product_type.title : "Нов продукт"}</p>
            <h3 className="mt-1 font-serif text-2xl font-semibold">{product?.title || "Добави продукт"}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product?.is_active ? "bg-emerald-100 text-emerald-900" : "bg-stone-700 text-[var(--admin-ink)]"}`}>
            {product?.is_active ? "Публикуван" : "Чернова"}
          </span>
        </div>
      </summary>

      <form action={upsertArtStudioProductAction} className="mt-6 grid gap-7 rounded-2xl bg-white p-5 text-stone-950 sm:p-7">
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <input type="hidden" name="options_json" value={JSON.stringify(options.map(({ row_id: _rowId, values, ...option }) => ({
          ...option,
          values: values.map(({ row_id: _valueRowId, ...value }) => value)
        })))} readOnly />
        <input type="hidden" name="offers_json" value={JSON.stringify(offers.map(({ row_id: _rowId, ...offer }) => offer))} readOnly />

        <fieldset className="grid gap-4">
          <legend className="font-serif text-2xl font-semibold">Основни данни</legend>
          <div className="grid gap-4 md:grid-cols-3">
            <label className={labelClass}>Продуктов тип
              <select name="product_type_id" value={productTypeId} onChange={(event) => setProductTypeId(event.target.value)} required className={fieldClass}>
                {productTypes.map((productType) => <option key={productType.id} value={productType.id}>{productType.title}</option>)}
              </select>
            </label>
            <label className={labelClass}>Категория
              <select name="category_id" defaultValue={product?.category_id || ""} className={fieldClass}>
                <option value="">Без категория</option>
                {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
              </select>
            </label>
            <label className={labelClass}>SKU
              <input name="sku" defaultValue={product?.sku || ""} className={fieldClass} placeholder="BN-TSHIRT-001" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Заглавие BG
              <input name="title_bg" defaultValue={product?.title || ""} required className={fieldClass} />
            </label>
            <label className={labelClass}>Title EN
              <input name="title_en" defaultValue={englishProduct?.title || ""} className={fieldClass} />
            </label>
            <label className={labelClass}>Slug BG
              <input name="slug_bg" defaultValue={product?.slug || ""} className={fieldClass} placeholder="teniska-bansko-lines" />
            </label>
            <label className={labelClass}>Slug EN
              <input name="slug_en" defaultValue={englishProduct?.slug || ""} className={fieldClass} placeholder="bansko-lines-tshirt" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Кратко описание BG
              <textarea name="short_description_bg" defaultValue={product?.short_description || ""} rows={3} className={fieldClass} />
            </label>
            <label className={labelClass}>Short description EN
              <textarea name="short_description_en" defaultValue={englishProduct?.short_description || ""} rows={3} className={fieldClass} />
            </label>
            <label className={labelClass}>Пълно описание BG
              <textarea name="description_bg" defaultValue={product?.description || ""} rows={7} className={fieldClass} placeholder="Поддържа Markdown." />
            </label>
            <label className={labelClass}>Full description EN
              <textarea name="description_en" defaultValue={englishProduct?.description || ""} rows={7} className={fieldClass} placeholder="Markdown supported." />
            </label>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-stone-200 pt-6">
          <legend className="font-serif text-2xl font-semibold">Снимки</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Основна снимка URL
              <input name="image_url" type="url" defaultValue={product?.image_url || ""} className={fieldClass} />
            </label>
            <div className="flex items-end">
              <Link href="/admin/media" className="admin-button admin-button-sage px-5 py-3 text-sm font-semibold">Отвори Медия</Link>
            </div>
            <label className={labelClass}>Alt текст BG
              <input name="image_alt_bg" defaultValue={product?.image_alt || ""} className={fieldClass} />
            </label>
            <label className={labelClass}>Alt text EN
              <input name="image_alt_en" defaultValue={englishProduct?.image_alt || ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>Галерия URLs, по един на ред
            <textarea name="gallery_urls" defaultValue={(product?.gallery_urls || []).join("\n")} rows={4} className={fieldClass} />
          </label>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-stone-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <legend className="font-serif text-2xl font-semibold">Цени и Payment Links</legend>
              <p className="mt-1 text-sm text-stone-600">Всеки различен краен размер или цена има собствен Stripe Payment Link.</p>
            </div>
            <button type="button" onClick={addOffer} className="admin-button admin-button-sage px-4 py-2 text-sm font-semibold">+ Добави цена</button>
          </div>
          {offers.length ? offers.map((offer) => (
            <div key={offer.row_id} className="grid gap-3 border-t border-stone-200 pt-4 md:grid-cols-[1fr_1fr_0.55fr_0.45fr_1.5fr_auto]">
              <input value={offer.label_bg} onChange={(event) => setOffers((items) => items.map((item) => item.row_id === offer.row_id ? { ...item, label_bg: event.target.value } : item))} className={fieldClass} placeholder="Размер / вариант BG" />
              <input value={offer.label_en || ""} onChange={(event) => setOffers((items) => items.map((item) => item.row_id === offer.row_id ? { ...item, label_en: event.target.value } : item))} className={fieldClass} placeholder="Option EN" />
              <input type="number" min="0" step="0.01" value={offer.price} onChange={(event) => setOffers((items) => items.map((item) => item.row_id === offer.row_id ? { ...item, price: Number(event.target.value) } : item))} className={fieldClass} aria-label="Цена" />
              <input value={offer.currency} maxLength={3} onChange={(event) => setOffers((items) => items.map((item) => item.row_id === offer.row_id ? { ...item, currency: event.target.value.toUpperCase() } : item))} className={fieldClass} aria-label="Валута" />
              <input type="url" value={offer.payment_link_url || ""} onChange={(event) => setOffers((items) => items.map((item) => item.row_id === offer.row_id ? { ...item, payment_link_url: event.target.value } : item))} className={fieldClass} placeholder="https://buy.stripe.com/..." />
              <button type="button" onClick={() => setOffers((items) => items.filter((item) => item.row_id !== offer.row_id))} className="admin-button admin-button-danger px-3 py-2 text-sm font-semibold">Премахни</button>
            </div>
          )) : <p className="text-sm text-stone-600">Добави поне една цена, за да може продуктът да се поръчва.</p>}
        </fieldset>

        <fieldset className="grid gap-5 border-t border-stone-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <legend className="font-serif text-2xl font-semibold">Прости опции</legend>
              <p className="mt-1 text-sm text-stone-600">Например модел, размер или цвят. Опциите не променят цената.</p>
            </div>
            <button type="button" onClick={addOption} className="admin-button admin-button-sage px-4 py-2 text-sm font-semibold">+ Добави опция</button>
          </div>
          {options.map((option) => (
            <section key={option.row_id} className="grid gap-4 border-t border-stone-200 pt-5">
              <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_1fr_0.7fr_auto]">
                <input value={option.option_key} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, option_key: event.target.value } : item))} className={fieldClass} placeholder="size" />
                <input value={option.label_bg} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, label_bg: event.target.value } : item))} className={fieldClass} placeholder="Размер" />
                <input value={option.label_en || ""} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, label_en: event.target.value } : item))} className={fieldClass} placeholder="Size" />
                <select value={option.input_type} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, input_type: event.target.value as DraftOption["input_type"] } : item))} className={fieldClass}>
                  <option value="select">Меню</option>
                  <option value="radio">Бутони</option>
                  <option value="swatch">Цветове</option>
                </select>
                <button type="button" onClick={() => setOptions((items) => items.filter((item) => item.row_id !== option.row_id))} className="admin-button admin-button-danger px-3 py-2 text-sm font-semibold">Премахни</button>
              </div>
              <label className="choice-row text-sm font-semibold text-stone-700">
                <input type="checkbox" checked={option.is_required} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, is_required: event.target.checked } : item))} className="choice-control" />
                Задължителен избор
              </label>
              <div className="grid gap-3">
                {option.values.map((value) => (
                  <div key={value.row_id} className="grid gap-3 md:grid-cols-[0.8fr_1fr_1fr_0.6fr_auto]">
                    <input value={value.value} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, values: item.values.map((entry) => entry.row_id === value.row_id ? { ...entry, value: event.target.value } : entry) } : item))} className={fieldClass} placeholder="white" />
                    <input value={value.label_bg} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, values: item.values.map((entry) => entry.row_id === value.row_id ? { ...entry, label_bg: event.target.value } : entry) } : item))} className={fieldClass} placeholder="Бяло" />
                    <input value={value.label_en || ""} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, values: item.values.map((entry) => entry.row_id === value.row_id ? { ...entry, label_en: event.target.value } : entry) } : item))} className={fieldClass} placeholder="White" />
                    <input type="color" value={value.hex_color || "#ffffff"} onChange={(event) => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, values: item.values.map((entry) => entry.row_id === value.row_id ? { ...entry, hex_color: event.target.value } : entry) } : item))} className="h-12 w-full rounded-xl border border-stone-300 bg-white p-1" aria-label="Цвят" />
                    <button type="button" onClick={() => setOptions((items) => items.map((item) => item.row_id === option.row_id ? { ...item, values: item.values.filter((entry) => entry.row_id !== value.row_id) } : item))} className="admin-button admin-button-danger px-3 py-2 text-sm font-semibold">−</button>
                  </div>
                ))}
                <button type="button" onClick={() => addValue(option.row_id)} className="admin-button admin-button-sage w-fit px-4 py-2 text-sm font-semibold">+ Стойност</button>
              </div>
            </section>
          ))}
        </fieldset>

        <fieldset className="grid gap-4 border-t border-stone-200 pt-6">
          <legend className="font-serif text-2xl font-semibold">SEO</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="seo_title_bg" defaultValue={product?.seo_title || ""} className={fieldClass} placeholder="SEO title BG" />
            <input name="seo_title_en" defaultValue={englishProduct?.seo_title || ""} className={fieldClass} placeholder="SEO title EN" />
            <textarea name="seo_description_bg" defaultValue={product?.seo_description || ""} rows={3} className={fieldClass} placeholder="SEO description BG" />
            <textarea name="seo_description_en" defaultValue={englishProduct?.seo_description || ""} rows={3} className={fieldClass} placeholder="SEO description EN" />
            <input name="og_title_bg" defaultValue={product?.og_title || ""} className={fieldClass} placeholder="Open Graph title BG" />
            <input name="og_title_en" defaultValue={englishProduct?.og_title || ""} className={fieldClass} placeholder="Open Graph title EN" />
            <textarea name="og_description_bg" defaultValue={product?.og_description || ""} rows={3} className={fieldClass} placeholder="Open Graph description BG" />
            <textarea name="og_description_en" defaultValue={englishProduct?.og_description || ""} rows={3} className={fieldClass} placeholder="Open Graph description EN" />
            <input name="og_image_url_bg" type="url" defaultValue={product?.og_image_url || ""} className={fieldClass} placeholder="Open Graph image URL BG" />
            <input name="og_image_url_en" type="url" defaultValue={englishProduct?.og_image_url || ""} className={fieldClass} placeholder="Open Graph image URL EN" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_index_bg" defaultChecked={product?.robots_index ?? true} className="choice-control" />Index BG</label>
            <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_follow_bg" defaultChecked={product?.robots_follow ?? true} className="choice-control" />Follow BG</label>
            <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_index_en" defaultChecked={englishProduct?.robots_index ?? true} className="choice-control" />Index EN</label>
            <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_follow_en" defaultChecked={englishProduct?.robots_follow ?? true} className="choice-control" />Follow EN</label>
          </div>
        </fieldset>

        <fieldset className="grid gap-3 border-t border-stone-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <label className="choice-row text-sm font-semibold"><input type="checkbox" name="personalization_text_enabled" defaultChecked={product?.personalization_text_enabled ?? true} className="choice-control" />Поле за име/текст</label>
          <label className="choice-row text-sm font-semibold"><input type="checkbox" name="idea_note_enabled" defaultChecked={product?.idea_note_enabled ?? true} className="choice-control" />Поле за бележка</label>
          <label className="choice-row text-sm font-semibold"><input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="choice-control" />Препоръчан</label>
          <label className="choice-row text-sm font-semibold"><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? false} className="choice-control" />Публикуван</label>
          <label className={labelClass}>Подредба<input type="number" name="sort_order" defaultValue={product?.sort_order ?? 100} className={fieldClass} /></label>
        </fieldset>

        <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-6">
          <button className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">{product ? "Запази продукта" : "Създай продукта"}</button>
          {product ? (
            <button formAction={archiveArtStudioProductAction} className="admin-button admin-button-danger px-5 py-3 text-sm font-semibold">Архивирай</button>
          ) : null}
        </div>
      </form>
    </details>
  );
}
