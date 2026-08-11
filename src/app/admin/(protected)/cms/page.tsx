import Link from "next/link";
import {
  deleteArtStudioServiceAction,
  upsertArtStudioServiceAction,
  upsertEditablePageAction
} from "@/app/admin/actions";
import { ContentDocumentTools } from "@/components/admin/content-document-tools";
import { getArtStudioServices, getEditablePages } from "@/lib/content";
import { editablePageDocumentFields } from "@/lib/content-transfer";
import { isLocale } from "@/lib/i18n";

type SearchParams = Promise<{
  saved?: string;
  deleted?: string;
  error?: string;
  locale?: string;
  translation_group_id?: string;
}>;

function textAreaValue(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

export default async function AdminPagesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, bgPages, enPages, services, englishServices] = await Promise.all([
    searchParams,
    getEditablePages({ includeDrafts: true, locale: "bg" }),
    getEditablePages({ includeDrafts: true, locale: "en" }),
    getArtStudioServices({ includeInactive: true, locale: "bg" }),
    getArtStudioServices({ includeInactive: true, locale: "en" })
  ]);
  const pages = [...bgPages, ...enPages].sort((a, b) => a.slug.localeCompare(b.slug) || a.locale.localeCompare(b.locale));
  const pagesByTranslation = new Map(pages.map((page) => [`${page.translation_group_id}:${page.locale}`, page]));
  const englishServicesById = new Map(englishServices.map((service) => [service.id, service]));
  const newPageLocale = params.locale && isLocale(params.locale) ? params.locale : "bg";
  const newPageTranslationGroup = params.translation_group_id || "";

  return (
    <div className="grid gap-10">
      <header>
        <p className="text-sm font-semibold uppercase text-stone-400">CMS</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Страници</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
          Редактирай статични страници, SEO мета данни и Art Studio услугите, които се показват като карти на сайта.
        </p>
      </header>

      {params.saved || params.deleted ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Промените са запазени.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {params.error}
        </div>
      ) : null}

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Public pages</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Съдържание на страници</h2>
        </div>

        <div className="grid gap-4">
          {[...pages, null].map((page, index) => {
            const alternateLocale = page?.locale === "bg" ? "en" : "bg";
            const counterpart = page
              ? pagesByTranslation.get(`${page.translation_group_id}:${alternateLocale}`)
              : null;

            return (
            <details
              id={page ? `page-${page.id}` : "new-page"}
              key={page?.id || "new-page"}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
              open={!page}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-stone-400">
                      {page ? `${page.locale.toUpperCase()} / ${page.locale === "en" ? "/en" : ""}/${page.slug} / ${page.status}` : "Нова страница"}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-semibold">{page?.title || "Добави страница"}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">
                    SEO + content
                  </span>
                </div>
              </summary>

              <form action={upsertEditablePageAction} className="mt-6 grid gap-4 rounded-2xl bg-white p-5 text-stone-950">
                {page ? <input type="hidden" name="id" value={page.id} /> : null}
                {page ? <input type="hidden" name="locale" value={page.locale} /> : null}
                <input type="hidden" name="translation_group_id" defaultValue={page?.translation_group_id || newPageTranslationGroup} />
                {page ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-100 p-3 text-sm">
                    <span className="font-semibold">Език: {page.locale === "bg" ? "Български" : "English"}</span>
                    {counterpart ? (
                      <Link href={`/admin/cms#page-${counterpart.id}`} className="admin-button admin-button-sage px-4 py-2 text-xs font-semibold">
                        Отвори {alternateLocale.toUpperCase()} версията
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/cms?locale=${alternateLocale}&translation_group_id=${page.translation_group_id}#new-page`}
                        className="admin-button admin-button-forest px-4 py-2 text-xs font-semibold"
                      >
                        + {alternateLocale === "en" ? "English" : "Български"} версия
                      </Link>
                    )}
                  </div>
                ) : newPageTranslationGroup ? (
                  <p className="rounded-xl bg-sage/40 p-3 text-sm font-semibold text-forest">
                    Създаваш {newPageLocale.toUpperCase()} версия, свързана с другия език.
                  </p>
                ) : null}
                <ContentDocumentTools
                  documentType="page"
                  currentLocale={page?.locale || newPageLocale}
                  translationGroupId={page?.translation_group_id || newPageTranslationGroup}
                  recordId={page?.id}
                  slug={page?.slug || "new-page"}
                  fieldNames={editablePageDocumentFields}
                />
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="grid gap-2 text-sm font-semibold">
                    Title
                    <input name="title" defaultValue={page?.title ?? ""} className="rounded-xl border border-stone-300 px-4 py-3" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Slug
                    <input name="slug" defaultValue={page?.slug ?? ""} placeholder="art-studio" className="rounded-xl border border-stone-300 px-4 py-3" />
                  </label>
                  {!page ? (
                    <label className="grid gap-2 text-sm font-semibold">
                      Language
                      <select name="locale" defaultValue={newPageLocale} className="rounded-xl border border-stone-300 px-4 py-3">
                        <option value="bg">Български</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                  ) : null}
                  <label className="grid gap-2 text-sm font-semibold">
                    Status
                    <select name="status" defaultValue={page?.status ?? "draft"} className="rounded-xl border border-stone-300 px-4 py-3">
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input name="eyebrow" defaultValue={page?.eyebrow ?? ""} placeholder="Eyebrow" className="rounded-xl border border-stone-300 px-4 py-3" />
                  <input name="sort_order" defaultValue={page?.sort_order ?? index * 10} placeholder="Sort order" className="rounded-xl border border-stone-300 px-4 py-3" />
                </div>

                <textarea name="excerpt" defaultValue={page?.excerpt ?? ""} rows={2} placeholder="Intro / excerpt" className="rounded-xl border border-stone-300 px-4 py-3" />
                <textarea name="content" defaultValue={page?.content ?? ""} rows={8} placeholder="Main content. Поддържа Markdown стил текст." className="rounded-xl border border-stone-300 px-4 py-3" />

                <div className="grid gap-4 md:grid-cols-2">
                  <input name="hero_image_url" defaultValue={page?.hero_image_url ?? ""} placeholder="Hero image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                  <input name="hero_image_alt" defaultValue={page?.hero_image_alt ?? ""} placeholder="Hero image alt" className="rounded-xl border border-stone-300 px-4 py-3" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input name="cta_label" defaultValue={page?.cta_label ?? ""} placeholder="CTA label" className="rounded-xl border border-stone-300 px-4 py-3" />
                  <input name="cta_url" defaultValue={page?.cta_url ?? ""} placeholder="CTA URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm font-semibold uppercase text-moss">SEO</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <input name="seo_title" defaultValue={page?.seo_title ?? ""} placeholder="SEO title" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <input name="seo_description" defaultValue={page?.seo_description ?? ""} placeholder="Meta description" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <input name="canonical_url" defaultValue={page?.canonical_url ?? ""} placeholder="Canonical URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <input name="og_image_url" defaultValue={page?.og_image_url ?? ""} placeholder="OG image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <input name="og_title" defaultValue={page?.og_title ?? ""} placeholder="OG title" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <input name="og_description" defaultValue={page?.og_description ?? ""} placeholder="OG description" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <input name="schema_type" defaultValue={page?.schema_type ?? "WebPage"} placeholder="Schema type" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="robots_index" defaultChecked={page?.robots_index ?? true} />
                        Index
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="robots_follow" defaultChecked={page?.robots_follow ?? true} />
                        Follow
                      </label>
                    </div>
                  </div>
                </div>

                <button className="admin-button admin-button-forest w-fit px-5 py-3 text-sm font-semibold">Save page</button>
              </form>
            </details>
            );
          })}
        </div>
      </section>

      <section id="art-studio-services" className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Art Studio</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Услуги като карти</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...services, null].map((service, index) => (
            <form key={service?.id || "new-service"} action={upsertArtStudioServiceAction} className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
              {service ? <input type="hidden" name="id" value={service.id} /> : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-moss">{service ? service.slug : "Нова услуга"}</p>
                  <h3 className="mt-1 font-serif text-2xl font-semibold">{service?.title || "Добави услуга"}</h3>
                </div>
                {service?.is_premium ? <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">Premium</span> : null}
              </div>
              <input name="title" defaultValue={service?.title ?? ""} placeholder="Title" className="rounded-xl border border-stone-300 px-4 py-3" />
              <input name="slug" defaultValue={service?.slug ?? ""} placeholder="slug" className="rounded-xl border border-stone-300 px-4 py-3" />
              <textarea name="description" defaultValue={service?.description ?? ""} rows={3} placeholder="Description" className="rounded-xl border border-stone-300 px-4 py-3" />
              <input name="image_url" defaultValue={service?.image_url ?? ""} placeholder="Image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
              <input name="image_alt" defaultValue={service?.image_alt ?? ""} placeholder="Image alt" className="rounded-xl border border-stone-300 px-4 py-3" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="button_label" defaultValue={service?.button_label ?? "Виж повече"} placeholder="Button label" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="button_url" defaultValue={service?.button_url ?? "/contact"} placeholder="Button URL" className="rounded-xl border border-stone-300 px-4 py-3" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="price_label" defaultValue={service?.price_label ?? ""} placeholder="Price label" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="sort_order" defaultValue={service?.sort_order ?? index * 10} placeholder="Sort order" className="rounded-xl border border-stone-300 px-4 py-3" />
              </div>
              <textarea name="features_input" defaultValue={textAreaValue(service?.features)} rows={3} placeholder="Features, one per line" className="rounded-xl border border-stone-300 px-4 py-3" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="seo_title" defaultValue={service?.seo_title ?? ""} placeholder="SEO title" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="seo_description" defaultValue={service?.seo_description ?? ""} placeholder="SEO description" className="rounded-xl border border-stone-300 px-4 py-3" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_premium" defaultChecked={service?.is_premium ?? false} />
                  Premium service
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" defaultChecked={service?.is_active ?? true} />
                  Active
                </label>
              </div>
              <div className="mt-2 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs font-semibold uppercase text-moss">English version</p>
                <input name="title_en" defaultValue={service ? englishServicesById.get(service.id)?.title || "" : ""} placeholder="English title" className="rounded-xl border border-stone-300 px-4 py-3" />
                <textarea name="description_en" defaultValue={service ? englishServicesById.get(service.id)?.description || "" : ""} rows={3} placeholder="English description" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="image_alt_en" defaultValue={service ? englishServicesById.get(service.id)?.image_alt || "" : ""} placeholder="English image alt" className="rounded-xl border border-stone-300 px-4 py-3" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="button_label_en" defaultValue={service ? englishServicesById.get(service.id)?.button_label || "" : ""} placeholder="Button label" className="rounded-xl border border-stone-300 px-4 py-3" />
                  <input name="price_label_en" defaultValue={service ? englishServicesById.get(service.id)?.price_label || "" : ""} placeholder="Price label" className="rounded-xl border border-stone-300 px-4 py-3" />
                </div>
                <textarea name="features_input_en" defaultValue={service ? textAreaValue(englishServicesById.get(service.id)?.features) : ""} rows={3} placeholder="English features, one per line" className="rounded-xl border border-stone-300 px-4 py-3" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="seo_title_en" defaultValue={service ? englishServicesById.get(service.id)?.seo_title || "" : ""} placeholder="English SEO title" className="rounded-xl border border-stone-300 px-4 py-3" />
                  <input name="seo_description_en" defaultValue={service ? englishServicesById.get(service.id)?.seo_description || "" : ""} placeholder="English SEO description" className="rounded-xl border border-stone-300 px-4 py-3" />
                </div>
              </div>
              <button className="admin-button admin-button-forest px-4 py-2 text-sm font-semibold">{service ? "Save service" : "Create service"}</button>
              {service ? (
                <details>
                  <summary className="admin-button admin-button-danger list-none px-4 py-2 text-sm font-semibold">Delete service</summary>
                  <div className="mt-3 grid gap-3 rounded-2xl bg-red-50 p-4 text-red-950">
                    <p className="text-sm">Изтрива услугата от Art Studio страницата.</p>
                    <button formAction={deleteArtStudioServiceAction} className="admin-button admin-button-danger px-4 py-2 text-sm font-semibold">
                      Confirm delete
                    </button>
                  </div>
                </details>
              ) : null}
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
