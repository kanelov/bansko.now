import { formatPrice } from "@/lib/business-platform/money";
import type { MenuCategory, MenuItem } from "@/lib/business-platform/menu";
import type { Locale } from "@/lib/types";

/**
 * Менюто, както го вижда гостът. Без клиентски JavaScript: категориите са
 * котви, артикулите - списък. Същата структура се ползва и в профила (откъс),
 * и на QR страницата (цялото).
 */

const labels = {
  bg: { soldOut: "Изчерпано", from: "от", menu: "Меню" },
  en: { soldOut: "Sold out", from: "from", menu: "Menu" }
};

export function menuAnchor(categoryId: string) {
  return `k-${categoryId.slice(0, 8)}`;
}

export function itemPriceText(item: MenuItem, locale: Locale) {
  if (item.variants.length > 0) {
    const named = item.variants.filter((variant) => variant.name.trim());

    if (named.length === item.variants.length && named.length > 0) {
      return named.map((variant) => `${variant.name} ${formatPrice(variant.priceCents, locale)}`).join(" · ");
    }

    const cheapest = Math.min(...item.variants.map((variant) => variant.priceCents));
    return `${labels[locale].from} ${formatPrice(cheapest, locale)}`;
  }

  return item.priceCents === null ? "" : formatPrice(item.priceCents, locale);
}

function MenuRow({ item, locale }: { item: MenuItem; locale: Locale }) {
  const soldOut = item.availability === "sold_out";
  const price = itemPriceText(item, locale);

  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-stone-200 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className={soldOut ? "font-semibold text-stone-650 line-through" : "font-semibold text-stone-950"}>{item.name}</p>
        {item.description ? <p className="mt-1 text-sm leading-6 text-stone-650">{item.description}</p> : null}
        {soldOut ? (
          <span className="mt-1 inline-block rounded-full bg-clay/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">
            {labels[locale].soldOut}
          </span>
        ) : null}
      </div>
      {price ? (
        <p className={soldOut ? "shrink-0 text-sm font-semibold text-stone-650 line-through" : "shrink-0 text-sm font-semibold text-forest"}>{price}</p>
      ) : null}
    </li>
  );
}

/** Цялото меню: една секция на категория, с котва за бързите връзки отгоре. */
export function BusinessMenuSections({ categories, locale }: { categories: MenuCategory[]; locale: Locale }) {
  return (
    <div className="grid gap-10">
      {categories.map((category) => (
        <section key={category.id} id={menuAnchor(category.id)} className="scroll-mt-24">
          <h2 className="font-serif text-2xl font-semibold text-forest">{category.name}</h2>
          {category.description ? <p className="mt-2 text-sm leading-6 text-stone-650">{category.description}</p> : null}
          <ul className="mt-4">
            {category.items.map((item) => (
              <MenuRow key={item.id} item={item} locale={locale} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Бързите връзки към категориите: обикновени котви, работят без JavaScript. */
export function BusinessMenuAnchors({ categories, locale }: { categories: MenuCategory[]; locale: Locale }) {
  if (categories.length < 2) {
    return null;
  }

  return (
    <nav aria-label={labels[locale].menu} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2 whitespace-nowrap">
        {categories.map((category) => (
          <li key={category.id}>
            <a
              href={`#${menuAnchor(category.id)}`}
              className="inline-block rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Откъсът в профила: първите категории с по няколко артикула. */
export function BusinessMenuExcerpt({
  categories,
  locale,
  categoryLimit = 2,
  itemLimit = 4
}: {
  categories: MenuCategory[];
  locale: Locale;
  categoryLimit?: number;
  itemLimit?: number;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {categories.slice(0, categoryLimit).map((category) => (
        <div key={category.id}>
          <h3 className="font-serif text-xl font-semibold text-forest">{category.name}</h3>
          <ul className="mt-3">
            {category.items.slice(0, itemLimit).map((item) => (
              <MenuRow key={item.id} item={item} locale={locale} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
