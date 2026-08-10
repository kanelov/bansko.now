import type { TocItem } from "@/lib/markdown-blocks";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function ArticleTableOfContents({ items, locale = "bg" }: { items: TocItem[]; locale?: Locale }) {
  if (items.length < 2) {
    return null;
  }

  const dictionary = getDictionary(locale);

  return (
    <nav className="mb-12 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft" aria-label={dictionary.contents}>
      <p className="text-sm font-semibold uppercase text-moss">{dictionary.contents}</p>
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
