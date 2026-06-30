import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/${category.slug}`}
      className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <p className="text-xs font-semibold uppercase text-moss">Bansko NOW</p>
      <h3 className="mt-3 font-serif text-2xl font-semibold text-stone-950">{category.name}</h3>
      {category.description ? (
        <p className="mt-3 text-sm leading-6 text-stone-600">{category.description}</p>
      ) : null}
      <span className="mt-5 inline-block text-sm font-semibold text-forest group-hover:text-clay">
        Виж повече
      </span>
    </Link>
  );
}
