import { saveArtStudioPageCopyAction } from "@/app/admin/art-studio-actions";
import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { getArtStudioProductTypes, getArtStudioPublicSettings } from "@/lib/art-studio";
import {
  formatFaqLines,
  formatPairLines,
  formatParagraphs,
  formatTrustLines,
  landingSectionKeys,
  landingSectionLabels,
  landingTextKeys,
  resolveArtStudioLandingCopy,
  resolveArtStudioLandingLinks,
  resolveArtStudioLandingSections,
  resolveArtStudioTypeCopy,
  resolveArtStudioTypeSections,
  typeSectionKeys,
  typeSectionLabels,
  typeTextKeys,
  type LandingTextKey,
  type TypeTextKey
} from "@/lib/art-studio-copy";
import type { Locale } from "@/lib/types";

const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none focus:border-forest focus:ring-2 focus:ring-sage";
const locales: Locale[] = ["bg", "en"];

const landingLabels: Record<LandingTextKey, string> = {
  eyebrow: "Надпис над заглавието",
  title: "Заглавие (H1)",
  lead: "Водещ текст под заглавието",
  metaDescription: "SEO описание (за Google)",
  ctaGallery: "Бутон „Разгледай галерията“",
  ctaProducts: "Бутон „Виж продуктите“",
  productsEyebrow: "Продукти: надпис",
  productsTitle: "Продукти: заглавие",
  productsText: "Продукти: текст",
  collectionsEyebrow: "Колекции от галерията: надпис",
  collectionsTitle: "Колекции от галерията: заглавие",
  collectionsText: "Колекции от галерията: текст",
  collectionsButton: "Колекции от галерията: бутон",
  servicesEyebrow: "Услуги: надпис",
  servicesTitle: "Услуги: заглавие",
  servicesButton: "Услуги: бутон",
  stepsEyebrow: "Стъпки за поръчка: надпис",
  stepsTitle: "Стъпки за поръчка: заглавие",
  customEyebrow: "Лични проекти: надпис",
  customTitle: "Лични проекти: заглавие",
  customText: "Лични проекти: текст",
  customButton: "Лични проекти: бутон",
  faqEyebrow: "Въпроси: надпис",
  faqTitle: "Въпроси: заглавие"
};
const longLandingKeys: LandingTextKey[] = ["lead", "metaDescription", "productsText", "collectionsText", "customText"];
const typeLabels: Record<TypeTextKey, string> = {
  eyebrow: "Надпис над заглавието",
  lead: "Водещ текст",
  cta: "Текст на бутона за поръчка",
  formEyebrow: "Форма: надпис над заглавието",
  formIntro: "Форма: уводен текст",
  designsTitle: "Готови дизайни: заглавие",
  designsText: "Готови дизайни: текст",
  thumbnailsTitle: "Миниатюри: надпис"
};
const longTypeKeys: TypeTextKey[] = ["lead", "formIntro", "designsText"];

function Field({ name, label, value, long = false }: { name: string; label: string; value: string; long?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-stone-700">
      {label}
      {long ? <textarea name={name} defaultValue={value} rows={3} className={fieldClass} /> : <input name={name} defaultValue={value} className={fieldClass} />}
    </label>
  );
}

function Lines({ name, label, value, hint, rows = 5 }: { name: string; label: string; value: string; hint: string; rows?: number }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-stone-700">
      {label}
      <textarea name={name} defaultValue={value} rows={rows} className={fieldClass} />
      <span className="font-normal text-stone-500">{hint}</span>
    </label>
  );
}

/** Admin "Текстове": every text of /art-studio and the product type pages, BG and EN side by side. */
export default async function ArtStudioCopyPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  const [settings, types] = await Promise.all([
    getArtStudioPublicSettings({ includeAdmin: true }),
    getArtStudioProductTypes({ locale: "bg", includeInactive: true })
  ]);
  const landingSections = resolveArtStudioLandingSections(settings.page_copy);
  const landingLinks = resolveArtStudioLandingLinks(settings.page_copy);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Art Studio</p>
        <h1 className="font-serif text-4xl font-semibold">Текстове и секции на страниците</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
          Тук са всички текстове на страницата <code>/art-studio</code> и на страниците на продуктовите типове, на български и английски. Полетата са попълнени с текущия текст. Изтрито поле връща стандартния текст. В списъците всеки ред е един елемент, а „ | “ разделя частите му.
        </p>
        <ArtStudioAdminNav />
      </div>

      {saved ? <p className="rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-sm text-emerald-900">Текстовете са запазени. Страниците се обновяват до няколко секунди.</p> : null}
      {error ? <p className="rounded-xl border border-red-300 bg-red-100 p-4 text-sm text-red-900">Грешка: {error}</p> : null}

      <form action={saveArtStudioPageCopyAction} className="grid gap-8">
        {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}

        <section className="grid gap-4 rounded-2xl bg-white p-5 text-stone-950">
          <h2 className="font-serif text-2xl font-semibold">Начална страница на Art Studio</h2>
          <div className="grid gap-4 rounded-xl border border-stone-200 p-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <p className="text-sm font-semibold">Показани секции</p>
              {landingSectionKeys.map((key) => (
                <label key={key} className="choice-row text-sm">
                  <input type="checkbox" name={`landing_sections.${key}`} defaultChecked={landingSections[key]} className="choice-control" />
                  {landingSectionLabels[key]}
                </label>
              ))}
            </div>
            <div className="grid gap-3">
              <Field name="landing_links.gallery" label="Връзка на бутона „Разгледай галерията“ (път като /art-studio/gallery или https адрес)" value={landingLinks.gallery} />
              <Field name="landing_links.custom" label="Връзка на бутона за лични поръчки (празно = бутонът от CMS страницата или /contact)" value={landingLinks.custom} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {locales.map((locale) => {
              const copy = resolveArtStudioLandingCopy(settings.page_copy, locale);
              return (
                <div key={locale} className="grid gap-3 rounded-xl border border-stone-200 p-4">
                  <p className="text-sm font-semibold uppercase text-moss">{locale === "bg" ? "Български" : "English"}</p>
                  {landingTextKeys.map((key) => (
                    <Field key={key} name={`landing.${locale}.${key}`} label={landingLabels[key]} value={copy[key]} long={longLandingKeys.includes(key)} />
                  ))}
                  <Lines name={`landing.${locale}.trust`} label="Предимства (лентата под картите)" value={formatTrustLines(copy.trust)} hint="Ред: икона | Заглавие | Текст. Икони: mountain, store, truck, pen-nib, check, palette, shirt." rows={5} />
                  <Lines name={`landing.${locale}.steps`} label="Стъпки за поръчка" value={formatPairLines(copy.steps)} hint="Ред: Заглавие | Текст." rows={4} />
                  <Lines name={`landing.${locale}.faq`} label="Често задавани въпроси" value={formatFaqLines(copy.faq)} hint="Ред: Въпрос | Отговор." rows={7} />
                </div>
              );
            })}
          </div>
        </section>

        {types.map((type) => (
          <details key={type.id} className="rounded-2xl bg-white p-5 text-stone-950">
            <summary className="cursor-pointer font-serif text-2xl font-semibold">{type.title} <span className="text-sm font-sans font-normal text-stone-500">/art-studio/{type.slug}</span></summary>
            <input type="hidden" name="type_names" value={type.internal_name} />
            <p className="mt-2 text-sm text-stone-600">Заглавието, описанието, SEO полетата, продаващият текст (Markdown), снимките и формата за поръчка се редактират в „Каталог“. Тук са останалите текстове и секциите на страницата.</p>
            {(() => {
              const sections = resolveArtStudioTypeSections(settings.page_copy, type.internal_name);
              return (
                <div className="mt-4 grid gap-4 rounded-xl border border-stone-200 p-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <p className="text-sm font-semibold">Показани секции</p>
                    {typeSectionKeys.map((key) => (
                      <label key={key} className="choice-row text-sm">
                        <input type="checkbox" name={`type_sections.${type.internal_name}.${key}`} defaultChecked={sections[key]} className="choice-control" />
                        {typeSectionLabels[key]}
                      </label>
                    ))}
                  </div>
                  <label className="grid gap-1 self-start text-xs font-semibold text-stone-700">
                    Брой готови дизайни на страницата (останалите са в „Виж още“)
                    <input type="number" name={`type_sections.${type.internal_name}.designsCount`} min={1} max={24} defaultValue={sections.designsCount} className={fieldClass} />
                  </label>
                </div>
              );
            })()}
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {locales.map((locale) => {
                const copy = resolveArtStudioTypeCopy(settings.page_copy, type.internal_name, locale);
                const prefix = `type.${type.internal_name}.${locale}`;
                return (
                  <div key={locale} className="grid gap-3 rounded-xl border border-stone-200 p-4">
                    <p className="text-sm font-semibold uppercase text-moss">{locale === "bg" ? "Български" : "English"}</p>
                    {typeTextKeys.map((key) => (
                      <Field key={key} name={`${prefix}.${key}`} label={typeLabels[key]} value={copy[key]} long={longTypeKeys.includes(key)} />
                    ))}
                    <Lines name={`${prefix}.benefits`} label="Предимства (карти под снимката)" value={formatPairLines(copy.benefits)} hint="Ред: Заглавие | Текст." rows={4} />
                    <Lines name={`${prefix}.intro`} label="Описателен текст (SEO)" value={formatParagraphs(copy.intro)} hint="Абзаците се разделят с празен ред. Не се показва, ако типът има продаващ текст в „Каталог“." rows={8} />
                    <Lines name={`${prefix}.faq`} label="Често задавани въпроси" value={formatFaqLines(copy.faq)} hint="Ред: Въпрос | Отговор. Не се показва, ако продаващият текст има :::faq блок." rows={6} />
                  </div>
                );
              })}
            </div>
          </details>
        ))}

        <div>
          <button className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">Запази текстовете</button>
        </div>
      </form>
    </div>
  );
}
