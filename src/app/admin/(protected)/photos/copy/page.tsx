import { savePhotoLicenseTypesAction, savePhotoPageCopyAction } from "@/app/admin/photo-actions";
import { PhotoAdminNav } from "@/components/admin/photo-admin-nav";
import { longPhotoTextKeys, photoTextKeys, photoTextLabels, resolvePhotoArchiveCopy } from "@/lib/photo-copy";
import { getPhotoPublicSettings } from "@/lib/photos";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale, PhotoLicenseType } from "@/lib/types";

type SearchParams = Promise<{ saved?: string; error?: string }>;

const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none focus:border-forest focus:ring-2 focus:ring-sage";
const labelClass = "grid gap-1 text-xs font-semibold text-stone-700";
const locales: Locale[] = ["bg", "en"];

function Field({ name, label, value, long = false, rows = 3 }: { name: string; label: string; value: string; long?: boolean; rows?: number }) {
  return (
    <label className={labelClass}>
      {label}
      {long ? <textarea name={name} defaultValue={value} rows={rows} className={fieldClass} /> : <input name={name} defaultValue={value} className={fieldClass} />}
    </label>
  );
}

function savedMessage(value?: string) {
  if (value === "licenses") return "Лицензите са запазени. Страниците се обновяват до няколко секунди.";
  return "Текстовете са запазени. Страниците се обновяват до няколко секунди.";
}

/** Admin "Текстове и лицензи": the texts of the photo archive pages and the license types, BG and EN side by side. */
export default async function PhotoCopyPage({ searchParams }: { searchParams: SearchParams }) {
  const { saved, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [settings, licenseRows] = await Promise.all([
    getPhotoPublicSettings(),
    supabase ? supabase.from("photo_license_types").select("*").order("sort_order", { ascending: true }) : Promise.resolve({ data: [] })
  ]);
  const licenses = (licenseRows.data ?? []) as PhotoLicenseType[];

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Фотоархив</p>
        <h1 className="font-serif text-4xl font-semibold">Текстове и лицензи</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
          Тук са текстовете на страницата <code>/photos</code>, на страниците на отделните фотографии и на формата за лиценз, на български и английски,
          както и двата лиценза с имена, описания, цени и пълни условия. Полетата са попълнени с текущия текст; изтрито поле връща стандартния.
        </p>
        <PhotoAdminNav />
      </div>

      {saved ? <p className="rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-sm text-emerald-900">{savedMessage(saved)}</p> : null}
      {error ? <p className="rounded-xl border border-red-300 bg-red-100 p-4 text-sm text-red-900">Грешка: {error}</p> : null}

      <form action={savePhotoPageCopyAction} className="grid gap-6 rounded-2xl bg-white p-5 text-stone-950">
        {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}
        <div>
          <h2 className="font-serif text-2xl font-semibold">Текстове на страниците</h2>
          <p className="mt-1 text-sm text-stone-600">
            Името на фотографа се използва в авторския надпис, в бележката за авторското право, в описанието при плащане и в данните за Google. Промени ли се името, тези текстове се обновяват сами, освен ако не са редактирани ръчно.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {locales.map((locale) => {
            const copy = resolvePhotoArchiveCopy(settings.page_copy, locale);
            return (
              <div key={locale} className="grid gap-3 rounded-xl border border-stone-200 p-4">
                <p className="text-sm font-semibold uppercase text-moss">{locale === "bg" ? "Български" : "English"}</p>
                {photoTextKeys.map((key) => (
                  <Field key={key} name={`${locale}.${key}`} label={photoTextLabels[key]} value={copy[key]} long={longPhotoTextKeys.includes(key)} />
                ))}
              </div>
            );
          })}
        </div>
        <div>
          <button className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">Запази текстовете</button>
        </div>
      </form>

      <form action={savePhotoLicenseTypesAction} className="grid gap-6 rounded-2xl bg-white p-5 text-stone-950">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Лицензи</h2>
          <p className="mt-1 text-sm text-stone-600">
            Цените са в евро: „репортажна“ е стандартното ниво, „пейзажна“ е премиум нивото на всяка фотография. Отделна снимка може да има собствена цена в „Фотографии“.
            При промяна на условията версията им се увеличава автоматично; платените поръчки пазят текста, с който са купени.
          </p>
        </div>
        {licenses.map((license) => (
          <details key={license.id} open className="rounded-xl border border-stone-200 p-4">
            <summary className="cursor-pointer font-serif text-xl font-semibold">
              {license.name_bg} <span className="font-sans text-sm font-normal text-stone-500">{license.code} · версия {license.terms_version} · {license.download_variant === "full_resolution" ? "пълна резолюция" : "уеб файл до 3000 px"}</span>
            </summary>
            <input type="hidden" name="license_ids" value={license.id} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field name={`name_bg_${license.id}`} label="Име BG" value={license.name_bg} />
              <Field name={`name_en_${license.id}`} label="Name EN" value={license.name_en} />
              <Field name={`summary_bg_${license.id}`} label="Кратко описание BG" value={license.summary_bg ?? ""} long rows={3} />
              <Field name={`summary_en_${license.id}`} label="Short description EN" value={license.summary_en ?? ""} long rows={3} />
              <Field name={`price_standard_${license.id}`} label="Цена репортажна (EUR)" value={String(license.price_standard_eur)} />
              <Field name={`price_premium_${license.id}`} label="Цена пейзажна (EUR)" value={String(license.price_premium_eur)} />
              <Field name={`print_run_limit_${license.id}`} label="Лимит на тиража (празно = без лимит)" value={license.print_run_limit == null ? "" : String(license.print_run_limit)} />
              <Field name={`sort_order_${license.id}`} label="Ред" value={String(license.sort_order)} />
              <Field name={`terms_bg_${license.id}`} label="Условия на лиценза BG" value={license.terms_bg} long rows={16} />
              <Field name={`terms_en_${license.id}`} label="License terms EN" value={license.terms_en} long rows={16} />
            </div>
            <label className="choice-row mt-3 text-sm">
              <input type="checkbox" name={`is_active_${license.id}`} defaultChecked={license.is_active} className="choice-control" />
              Предлага се на сайта
            </label>
          </details>
        ))}
        {!licenses.length ? (
          <p className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">Няма лицензи в базата. Изпълни <code>supabase/photo-library-licenses.sql</code>, за да ги създадеш.</p>
        ) : null}
        <div>
          <button className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">Запази лицензите</button>
        </div>
      </form>
    </div>
  );
}
