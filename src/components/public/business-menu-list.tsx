import "@/styles/menu-paper.css";
import { PaperCategoryHead } from "@/components/public/paper-menu";
import type { BusinessMenu, MenuItem } from "@/lib/business-platform/menu";
import { formatPrice } from "@/lib/business-platform/money";
import type { Locale } from "@/lib/types";

/**
 * Менюто за гости: QR страницата го показва цялото, профилът - откъс. Видът е
 * „хартиеното меню“ (menu-paper.css: иконка на категорията, точки до цената,
 * косъм между редовете), общ с телевизора и печата. Само сървър, без JavaScript.
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
    <div className="grid gap-9">
      {menu.categories.map((category) => {
        const items = maxItemsPerCategory ? category.items.slice(0, maxItemsPerCategory) : category.items;

        return (
          <section key={category.id} id={`${anchorPrefix}-${category.id}`} className="scroll-mt-32">
            <PaperCategoryHead icon={category.icon} name={category.name} />
            {category.description ? <p className="paper-category__note text-sm">{category.description}</p> : null}

            {items.length === 0 ? (
              <p className="mt-3 text-sm text-stone-650">{locale === "en" ? "Nothing here yet." : "Още нищо тук."}</p>
            ) : (
              <ul className="mt-1">
                {items.map((item) => (
                  <MenuRow key={item.id} item={item} locale={locale} showImages={showImages} soldOutLabel={soldOutLabel} />
                ))}
              </ul>
            )}

            {maxItemsPerCategory && category.items.length > maxItemsPerCategory ? (
              <p className="paper-item__desc mt-2">
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
  const extra = [...item.tags, ...(item.allergens.length ? [(locale === "en" ? "allergens: " : "алергени: ") + item.allergens.join(", ")] : [])];

  return (
    <li className={soldOut ? "paper-item paper-item--sold" : "paper-item"}>
      {showImages && item.media?.w480 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.media.w480}
          srcSet={item.media.w960 ? `${item.media.w480} 480w, ${item.media.w960} 960w` : undefined}
          sizes="56px"
          alt={item.media.alt ?? ""}
          width={56}
          height={56}
          loading="lazy"
          className="mr-3 h-14 w-14 flex-none self-center rounded-lg object-cover"
        />
      ) : null}

      <span className="paper-item__text">
        <span className="paper-item__name">{item.name}</span>
        {soldOut ? <span className="paper-item__sold">{soldOutLabel}</span> : null}
        {item.description ? <span className="paper-item__desc">{item.description}</span> : null}
        {item.variants.length > 0 ? (
          <span className="paper-item__desc not-italic">
            {item.variants.map((variant, index) => (
              <span key={variant.id}>
                {index > 0 ? " · " : ""}
                {variant.name ? `${variant.name} ` : ""}
                <b className="font-semibold text-[var(--paper-ink)]">{formatPrice(variant.priceCents, locale)}</b>
              </span>
            ))}
          </span>
        ) : null}
        {extra.length ? <span className="paper-item__desc">{extra.join(" · ")}</span> : null}
      </span>

      {item.variants.length === 0 && item.priceCents !== null ? (
        <>
          <span className="paper-item__dots" aria-hidden />
          <span className="paper-item__price">{formatPrice(item.priceCents, locale)}</span>
        </>
      ) : null}
    </li>
  );
}
