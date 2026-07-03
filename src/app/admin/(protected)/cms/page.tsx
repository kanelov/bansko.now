import {
  deleteArtStudioServiceAction,
  upsertArtStudioServiceAction,
  upsertEditablePageAction
} from "@/app/admin/actions";
import { getArtStudioServices, getEditablePages } from "@/lib/content";

type SearchParams = Promise<{ saved?: string; deleted?: string; error?: string }>;

function textAreaValue(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

export default async function AdminPagesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, pages, services] = await Promise.all([
    searchParams,
    getEditablePages({ includeDrafts: true }),
    getArtStudioServices({ includeInactive: true })
  ]);

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
          {[...pages, null].map((page, index) => (
            <details key={page?.id || "new-page"} className="rounded-2xl border border-white/10 bg-white/5 p-5" open={!page}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-stone-400">
                      {page ? `/${page.slug} / ${page.status}` : "Нова страница"}
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
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold">
                    Title
                    <input name="title" defaultValue={page?.title ?? ""} className="rounded-xl border border-stone-300 px-4 py-3" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Slug
                    <input name="slug" defaultValue={page?.slug ?? ""} placeholder="art-studio" className="rounded-xl border border-stone-300 px-4 py-3" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Status
                    <select name="status" defaultValue={page?.status ?? "published"} className="rounded-xl border border-stone-300 px-4 py-3">
                      <option value="published">published</option>
                      <option value="draft">draft</option>
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
          ))}
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
