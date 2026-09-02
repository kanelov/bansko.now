import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { ArtStudioProductEditor } from "@/components/admin/art-studio-product-editor";
import { upsertArtStudioCategoryAction, upsertArtStudioProductTypeAction } from "@/app/admin/art-studio-actions";
import { getArtStudioCategories, getArtStudioProducts, getArtStudioProductTypes } from "@/lib/art-studio";

type SearchParams = Promise<{ saved?: string; archived?: string; error?: string }>;
const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950";

export default async function AdminArtStudioProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, bgTypes, enTypes, bgCategories, enCategories, bgProducts, enProducts] = await Promise.all([
    searchParams,
    getArtStudioProductTypes({ locale: "bg", includeInactive: true }),
    getArtStudioProductTypes({ locale: "en", includeInactive: true }),
    getArtStudioCategories({ locale: "bg", includeInactive: true }),
    getArtStudioCategories({ locale: "en", includeInactive: true }),
    getArtStudioProducts({ locale: "bg", includeInactive: true }),
    getArtStudioProducts({ locale: "en", includeInactive: true })
  ]);
  const enTypeById = new Map(enTypes.map((item) => [item.id, item]));
  const enCategoryById = new Map(enCategories.map((item) => [item.id, item]));
  const enProductById = new Map(enProducts.map((item) => [item.id, item]));

  return (
    <div className="grid gap-10">
      <header className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Art Studio</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Каталог</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">Типове, категории, продукти, прости опции и Stripe Payment Links.</p>
        </div>
        <ArtStudioAdminNav />
      </header>

      {params.saved || params.archived ? <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-100">Промените са запазени.</p> : null}
      {params.error ? <p className="rounded-xl border border-red-300/30 bg-red-500/10 p-4 text-sm font-semibold text-red-100">{params.error}</p> : null}
      {!bgTypes.length ? <p className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">Art Studio таблиците или продуктовите типове още не са добавени. След миграцията създай първия тип от формата по-долу.</p> : null}

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Структура</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Продуктови типове</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[...bgTypes, null].map((type, index) => {
            const english = type ? enTypeById.get(type.id) : null;
            return (
              <form key={type?.id || "new-type"} action={upsertArtStudioProductTypeAction} className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
                {type ? <input type="hidden" name="id" value={type.id} /> : null}
                <h3 className="font-serif text-2xl font-semibold">{type?.title || "Нов продуктов тип"}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="title_bg" defaultValue={type?.title || ""} required className={fieldClass} placeholder="Заглавие BG" />
                  <input name="title_en" defaultValue={english?.title || ""} className={fieldClass} placeholder="Title EN" />
                  <input name="slug_bg" defaultValue={type?.slug || ""} className={fieldClass} placeholder="slug-bg" />
                  <input name="slug_en" defaultValue={english?.slug || ""} className={fieldClass} placeholder="slug-en" />
                  <input name="internal_name" defaultValue={type?.internal_name || ""} className={fieldClass} placeholder="internal-name" />
                  <input name="icon_name" defaultValue={type?.icon_name || ""} className={fieldClass} placeholder="Font Awesome icon" />
                </div>
                <input name="image_url" type="url" defaultValue={type?.image_url || ""} className={fieldClass} placeholder="Image URL" />
                <textarea name="gallery_urls" defaultValue={(type?.gallery_urls ?? []).join("\n")} rows={3} className={fieldClass} placeholder="Примерни дизайни за миниатюрите на страницата: по един URL на снимка на ред" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="image_alt_bg" defaultValue={type?.image_alt || ""} className={fieldClass} placeholder="Image alt BG" />
                  <input name="image_alt_en" defaultValue={english?.image_alt || ""} className={fieldClass} placeholder="Image alt EN" />
                  <textarea name="description_bg" defaultValue={type?.description || ""} rows={3} className={fieldClass} placeholder="Описание BG" />
                  <textarea name="description_en" defaultValue={english?.description || ""} rows={3} className={fieldClass} placeholder="Description EN" />
                  <input name="seo_title_bg" defaultValue={type?.seo_title || ""} className={fieldClass} placeholder="SEO title BG" />
                  <input name="seo_title_en" defaultValue={english?.seo_title || ""} className={fieldClass} placeholder="SEO title EN" />
                  <textarea name="seo_description_bg" defaultValue={type?.seo_description || ""} rows={2} className={fieldClass} placeholder="SEO description BG" />
                  <textarea name="seo_description_en" defaultValue={english?.seo_description || ""} rows={2} className={fieldClass} placeholder="SEO description EN" />
                  <input name="og_title_bg" defaultValue={type?.og_title || ""} className={fieldClass} placeholder="Open Graph title BG" />
                  <input name="og_title_en" defaultValue={english?.og_title || ""} className={fieldClass} placeholder="Open Graph title EN" />
                  <textarea name="og_description_bg" defaultValue={type?.og_description || ""} rows={2} className={fieldClass} placeholder="Open Graph description BG" />
                  <textarea name="og_description_en" defaultValue={english?.og_description || ""} rows={2} className={fieldClass} placeholder="Open Graph description EN" />
                  <input name="og_image_url_bg" type="url" defaultValue={type?.og_image_url || ""} className={fieldClass} placeholder="Open Graph image URL BG" />
                  <input name="og_image_url_en" type="url" defaultValue={english?.og_image_url || ""} className={fieldClass} placeholder="Open Graph image URL EN" />
                  <textarea name="content_bg" defaultValue={type?.content || ""} rows={8} className={`${fieldClass} sm:col-span-2`} placeholder="Продаващ текст BG (Markdown). Може да съдържа :::faq блок с въпроси и отговори." />
                  <textarea name="content_en" defaultValue={english?.content || ""} rows={8} className={`${fieldClass} sm:col-span-2`} placeholder="Selling copy EN (Markdown), optional :::faq block." />
                  <textarea name="form_config_json" defaultValue={type ? JSON.stringify(type.form_config ?? {}, null, 2) : ""} rows={10} className={`${fieldClass} font-mono text-xs sm:col-span-2`} placeholder='Форма за поръчка (JSON): {"photo_upload":"optional","quantity":true,"fields":[{"key":"size","label_bg":"Размер","label_en":"Size","required":true,"options":[{"value":"m","label_bg":"M","label_en":"M"}]}]}' />
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="is_featured" defaultChecked={type?.is_featured ?? false} className="choice-control" />Препоръчан</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="is_active" defaultChecked={type?.is_active ?? true} className="choice-control" />Активен</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_index_bg" defaultChecked={type?.robots_index ?? true} className="choice-control" />Index BG</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_follow_bg" defaultChecked={type?.robots_follow ?? true} className="choice-control" />Follow BG</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_index_en" defaultChecked={english?.robots_index ?? true} className="choice-control" />Index EN</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_follow_en" defaultChecked={english?.robots_follow ?? true} className="choice-control" />Follow EN</label>
                  <input type="number" name="sort_order" defaultValue={type?.sort_order ?? index * 10} className={fieldClass} aria-label="Подредба" />
                </div>
                <button className="admin-button admin-button-forest px-4 py-2 text-sm font-semibold">{type ? "Запази типа" : "Създай типа"}</button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Организация</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Категории</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[...bgCategories, null].map((category, index) => {
            const english = category ? enCategoryById.get(category.id) : null;
            return (
              <form key={category?.id || "new-category"} action={upsertArtStudioCategoryAction} className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
                {category ? <input type="hidden" name="id" value={category.id} /> : null}
                <h3 className="font-serif text-2xl font-semibold">{category?.title || "Нова категория"}</h3>
                <select name="product_type_id" defaultValue={category?.product_type_id || bgTypes[0]?.id || ""} required className={fieldClass}>
                  {bgTypes.map((type) => <option key={type.id} value={type.id}>{type.title}</option>)}
                </select>
                <input name="title_bg" defaultValue={category?.title || ""} required className={fieldClass} placeholder="Заглавие BG" />
                <input name="title_en" defaultValue={english?.title || ""} className={fieldClass} placeholder="Title EN" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="slug_bg" defaultValue={category?.slug || ""} className={fieldClass} placeholder="slug-bg" />
                  <input name="slug_en" defaultValue={english?.slug || ""} className={fieldClass} placeholder="slug-en" />
                  <input name="internal_name" defaultValue={category?.internal_name || ""} className={fieldClass} placeholder="internal-name" />
                  <input name="icon_name" defaultValue={category?.icon_name || ""} className={fieldClass} placeholder="icon" />
                </div>
                <input name="image_url" type="url" defaultValue={category?.image_url || ""} className={fieldClass} placeholder="Image URL" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="image_alt_bg" defaultValue={category?.image_alt || ""} className={fieldClass} placeholder="Image alt BG" />
                  <input name="image_alt_en" defaultValue={english?.image_alt || ""} className={fieldClass} placeholder="Image alt EN" />
                </div>
                <textarea name="description_bg" defaultValue={category?.description || ""} rows={2} className={fieldClass} placeholder="Описание BG" />
                <textarea name="description_en" defaultValue={english?.description || ""} rows={2} className={fieldClass} placeholder="Description EN" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="seo_title_bg" defaultValue={category?.seo_title || ""} className={fieldClass} placeholder="SEO title BG" />
                  <input name="seo_title_en" defaultValue={english?.seo_title || ""} className={fieldClass} placeholder="SEO title EN" />
                  <textarea name="seo_description_bg" defaultValue={category?.seo_description || ""} rows={2} className={fieldClass} placeholder="SEO description BG" />
                  <textarea name="seo_description_en" defaultValue={english?.seo_description || ""} rows={2} className={fieldClass} placeholder="SEO description EN" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="choice-control" />Активна</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_index_bg" defaultChecked={category?.robots_index ?? true} className="choice-control" />Index BG</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_follow_bg" defaultChecked={category?.robots_follow ?? true} className="choice-control" />Follow BG</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_index_en" defaultChecked={english?.robots_index ?? true} className="choice-control" />Index EN</label>
                  <label className="choice-row text-sm font-semibold"><input type="checkbox" name="robots_follow_en" defaultChecked={english?.robots_follow ?? true} className="choice-control" />Follow EN</label>
                  <input type="number" name="sort_order" defaultValue={category?.sort_order ?? index * 10} className={fieldClass} aria-label="Подредба" />
                </div>
                <button className="admin-button admin-button-forest px-4 py-2 text-sm font-semibold">{category ? "Запази" : "Създай"}</button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Продукти</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Карти и поръчки</h2>
        </div>
        <div className="grid gap-4">
          {bgTypes.length ? [...bgProducts, null].map((product) => (
            <ArtStudioProductEditor
              key={product?.id || "new-product"}
              product={product}
              englishProduct={product ? enProductById.get(product.id) || null : null}
              productTypes={bgTypes}
              categories={bgCategories}
            />
          )) : null}
        </div>
      </section>
    </div>
  );
}
