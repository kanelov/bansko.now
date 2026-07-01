import type { TocItem } from "@/lib/markdown-blocks";

export function ArticleTableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) {
    return null;
  }

  return (
    <nav className="mb-12 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft" aria-label="Съдържание на статията">
      <p className="text-sm font-semibold uppercase text-moss">В статията</p>
      <ol className="mt-5 grid gap-3 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li key={`${item.id}-${item.text}`} className={item.level === 3 ? "pl-4" : undefined}>
            <a href={`#${item.id}`} className="font-semibold text-stone-700 transition hover:text-forest">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
