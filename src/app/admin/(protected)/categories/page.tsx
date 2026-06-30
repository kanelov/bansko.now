import { getCategories } from "@/lib/content";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Taxonomy</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Categories</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category.slug} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase text-stone-400">/{category.slug}</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold">{category.name}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
