import type { BusinessMenu, MenuItem } from "@/lib/business-platform/menu";
import { formatPrice } from "@/lib/business-platform/money";
import type { Locale } from "@/lib/types";

/**
 * Менюто за гости: QR страницата го показва цялото, профилът - откъс.
 * Само сървър, без JavaScript: котви, списък, цени; свършилото е зачертано.
 */
export function BusinessMenuList({
  menu,
  locale,
  maxItemsPerCategory,
  showImages = true,
  anchorPrefix = "menu"
}: {
  menu: BusinessMenu;
  locale: Locale;
  maxItemsPerCategory?: number;
  showImages?: boolean;
  anchorPrefix?: string;
}) {
  const soldOutLabel = locale === "en" ? "sold out" : "свърши";

  return (
    <div className="grid gap-10">
      {menu.categories.map((category) => {
        const items = maxItemsPerCategory ? category.items.slice(0, maxItemsPerCategory) : category.items;

        return (
          <section key={category.id} id={`${anchorPrefix}-${category.id}`} className="scroll-mt-28">
            <h2 className="font-display text-2xl font-semibold text-forest">{category.name}</h2>
            {category.description ? <p className="mt-1 text-sm text-stone-650">{category.description}</p> : null}

            {items.length === 0 ? (
              <p className="mt-3 text-sm text-stone-650">{locale === "en" ? "Nothing here yet." : "Още нищо тук."}</p>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--stone)]">
                {items.map((item) => (
                  <MenuRow key={item.id} item={item} locale={locale} showImages={showImages} soldOutLabel={soldOutLabel} />
                ))}
              </ul>
            )}

            {maxItemsPerCategory && category.items.length > maxItemsPerCategory ? (
              <p className="mt-2 text-sm text-stone-650">
                {locale === "en" ? `+ ${category.items.length - maxItemsPerCategory} more` : `+ още ${category.items.length - maxItemsPerCategory}`}
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function MenuRow({ item, locale, showImages, soldOutLabel }: { item: MenuItem; locale: Locale; showImages: boolean; soldOutLabel: string }) {
  const soldOut = item.availability === "sold_out";

  return (
    <li className="flex gap-4 py-3">
      {showImages && item.media?.w480 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.media.w480}
          srcSet={item.media.w960 ? `${item.media.w480} 480w, ${item.media.w960} 960w` : undefined}
          sizes="64px"
          alt={item.media.alt ?? ""}
          width={64}
          height={64}
          loading="lazy"
          className="h-16 w-16 flex-none rounded-xl object-cover"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={soldOut ? "font-semibold text-stone-500 line-through decoration-clay" : "font-semibold"}>
            {item.name}
            {soldOut ? <span className="ml-2 rounded-full bg-clay px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white no-underline">{soldOutLabel}</span> : null}
          </p>
          {item.variants.length === 0 && item.priceCents !== null ? (
            <p className="flex-none font-semibold tabular-nums">{formatPrice(item.priceCents, locale)}</p>
          ) : null}
        </div>

        {item.description ? <p className="mt-0.5 text-sm text-stone-650">{item.description}</p> : null}

        {item.variants.length > 0 ? (
          <dl className="mt-1 grid gap-0.5 text-sm">
            {item.variants.map((variant) => (
              <div key={variant.id} className="flex items-baseline justify-between gap-3">
                <dt className="text-stone-650">{variant.name}</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(variant.priceCents, locale)}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {item.allergens.length || item.tags.length ? (
          <p className="mt-1 text-xs text-stone-500">
            {[...item.tags, ...(item.allergens.length ? [(locale === "en" ? "allergens: " : "алергени: ") + item.allergens.join(", ")] : [])].join(" · ")}
          </p>
        ) : null}
      </div>
    </li>
  );
}
