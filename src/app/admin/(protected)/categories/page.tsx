import { deleteCategoryAction, upsertCategoryAction } from "@/app/admin/actions";
import { getCategories } from "@/lib/content";

type SearchParams = Promise<{ saved?: string; deleted?: string; error?: string }>;

export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, categories] = await Promise.all([searchParams, getCategories()]);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Taxonomy</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Categories</h1>
      </div>

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

      <div className="grid gap-4">
        {[...categories, null].map((category, index) => (
          <details key={category?.slug || "new-category"} className="rounded-2xl border border-white/10 bg-white/5 p-5" open={!category}>
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">
                    {category ? `/${category.slug}` : "Нова категория"}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl font-semibold">{category?.name || "Добави категория"}</h2>
                  {category?.description ? <p className="mt-2 text-sm leading-6 text-stone-300">{category.description}</p> : null}
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">SEO</span>
              </div>
            </summary>

            <form action={upsertCategoryAction} className="mt-6 grid gap-4 rounded-2xl bg-white p-5 text-stone-950">
              {category ? <input type="hidden" name="id" value={category.id} /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Name
                  <input name="name" defaultValue={category?.name ?? ""} className="rounded-xl border border-stone-300 px-4 py-3" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Slug
                  <input name="slug" defaultValue={category?.slug ?? ""} placeholder={`category-${index}`} className="rounded-xl border border-stone-300 px-4 py-3" />
                </label>
              </div>
              <textarea name="description" defaultValue={category?.description ?? ""} rows={3} placeholder="Category description" className="rounded-xl border border-stone-300 px-4 py-3" />
              <div className="grid gap-4 md:grid-cols-2">
                <input name="seo_title" defaultValue={category?.seo_title ?? ""} placeholder="SEO title" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="seo_description" defaultValue={category?.seo_description ?? ""} placeholder="Meta description" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="canonical_url" defaultValue={category?.canonical_url ?? ""} placeholder="Canonical URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="og_image_url" defaultValue={category?.og_image_url ?? ""} placeholder="OG image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="og_title" defaultValue={category?.og_title ?? ""} placeholder="OG title" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="og_description" defaultValue={category?.og_description ?? ""} placeholder="OG description" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="schema_type" defaultValue={category?.schema_type ?? "CollectionPage"} placeholder="Schema type" className="rounded-xl border border-stone-300 px-4 py-3" />
                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="robots_index" defaultChecked={category?.robots_index ?? true} />
                    Index
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="robots_follow" defaultChecked={category?.robots_follow ?? true} />
                    Follow
                  </label>
                </div>
              </div>
              <button className="admin-button admin-button-forest w-fit px-5 py-3 text-sm font-semibold">
                {category ? "Save category" : "Create category"}
              </button>
            </form>

            {category ? (
              <details className="mt-5">
              <summary className="admin-button admin-button-danger list-none px-4 py-2 text-xs font-semibold">
                Delete category
              </summary>
              <form action={deleteCategoryAction} className="mt-3 grid gap-3 rounded-xl border border-red-300/20 bg-red-950/30 p-3">
                <input type="hidden" name="id" value={category.id} />
                <p className="text-xs leading-5 text-red-100">
                  Статиите остават в базата, но губят тази категория.
                </p>
                <button className="admin-button admin-button-danger px-4 py-2 text-xs font-semibold">
                  Confirm delete
                </button>
              </form>
              </details>
            ) : null}
          </details>
        ))}
      </div>
    </div>
  );
}
