import { deleteCategoryAction } from "@/app/admin/actions";
import { getCategories } from "@/lib/content";

type SearchParams = Promise<{ deleted?: string; error?: string }>;

export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, categories] = await Promise.all([searchParams, getCategories()]);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Taxonomy</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Categories</h1>
      </div>

      {params.deleted ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Категорията е изтрита.
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category.slug} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase text-stone-400">/{category.slug}</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold">{category.name}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{category.description}</p>
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
          </div>
        ))}
      </div>
    </div>
  );
}
