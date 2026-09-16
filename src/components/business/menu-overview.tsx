import Link from "next/link";
import {
  moveMenuCategoryAction,
  moveMenuItemAction,
  setMenuItemAvailabilityAction,
  setMenuItemVisibilityAction
} from "@/app/business/menu/actions";
import { portalUi } from "@/components/business/ui";
import type { BusinessMenu, MenuCategory, MenuItem } from "@/lib/business-platform/menu";
import { formatPrice } from "@/lib/business-platform/money";

/** Списъкът на менюто в портала: категории с артикули и бързите действия. */
export function MenuOverview({ businessId, menu }: { businessId: string; menu: BusinessMenu }) {
  return (
    <div className="grid gap-5">
      {menu.categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          businessId={businessId}
          category={category}
          first={index === 0}
          last={index === menu.categories.length - 1}
        />
      ))}
    </div>
  );
}

function CategoryCard({ businessId, category, first, last }: { businessId: string; category: MenuCategory; first: boolean; last: boolean }) {
  return (
    <section className={portalUi.card + " grid gap-4"} aria-labelledby={`category-${category.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`category-${category.id}`} className={portalUi.h2 + " flex flex-wrap items-center gap-2"}>
            {category.name}
            {!category.isActive ? <span className={portalUi.badge + " bg-stone-200 text-stone-700"}>скрита</span> : null}
          </h2>
          {category.names.en ? <p className="text-sm text-stone-650">{category.names.en}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MoveButtons action={moveMenuCategoryAction} businessId={businessId} id={category.id} first={first} last={last} />
          <Link href={`/business/menu/categories/${category.id}`} className={portalUi.smallButton}>
            Редактирай
          </Link>
          <Link href={`/business/menu/items/new?category=${category.id}`} className={portalUi.smallButton + " border-forest text-forest"}>
            + Артикул
          </Link>
        </div>
      </header>

      {category.items.length === 0 ? (
        <p className="text-sm text-stone-650">Няма артикули в тази категория.</p>
      ) : (
        <ul className="grid gap-2">
          {category.items.map((item, index) => (
            <ItemRow
              key={item.id}
              businessId={businessId}
              categoryId={category.id}
              item={item}
              first={index === 0}
              last={index === category.items.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemRow({
  businessId,
  categoryId,
  item,
  first,
  last
}: {
  businessId: string;
  categoryId: string;
  item: MenuItem;
  first: boolean;
  last: boolean;
}) {
  const soldOut = item.availability === "sold_out";

  return (
    <li id={`item-${item.id}`} className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-paper p-3 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center">
      <div className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--stone)] bg-white">
        {item.media?.w480 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.media.w480} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/business/menu/items/${item.id}`} className={soldOut ? "font-semibold line-through decoration-clay" : "font-semibold"}>
            {item.name}
          </Link>
          {item.names.en ? <span className="text-sm text-stone-650">· {item.names.en}</span> : null}
          {soldOut ? <span className={portalUi.badge + " bg-clay text-white"}>свърши</span> : null}
          {!item.isActive ? <span className={portalUi.badge + " bg-stone-200 text-stone-700"}>скрит</span> : null}
        </div>
        <p className="mt-0.5 text-sm text-stone-650">
          {item.variants.length > 0
            ? item.variants.map((variant) => `${variant.name} ${formatPrice(variant.priceCents)}`).join(" · ")
            : item.priceCents !== null
              ? formatPrice(item.priceCents)
              : "без цена"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form action={setMenuItemAvailabilityAction}>
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="availability" value={soldOut ? "available" : "sold_out"} />
          <button className={portalUi.smallButton + (soldOut ? " border-forest text-forest" : " border-clay/60 text-clay")}>
            {soldOut ? "Има го" : "Свърши"}
          </button>
        </form>
        <form action={setMenuItemVisibilityAction}>
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="is_active" value={item.isActive ? "0" : "1"} />
          <button className={portalUi.smallButton}>{item.isActive ? "Скрий" : "Покажи"}</button>
        </form>
        <MoveButtons action={moveMenuItemAction} businessId={businessId} id={item.id} categoryId={categoryId} first={first} last={last} />
      </div>
    </li>
  );
}

function MoveButtons({
  action,
  businessId,
  id,
  categoryId,
  first,
  last
}: {
  action: (formData: FormData) => Promise<void>;
  businessId: string;
  id: string;
  categoryId?: string;
  first: boolean;
  last: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {(["up", "down"] as const).map((direction) => (
        <form key={direction} action={action}>
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="id" value={id} />
          {categoryId ? <input type="hidden" name="category_id" value={categoryId} /> : null}
          <input type="hidden" name="direction" value={direction} />
          <button
            className={portalUi.smallButton}
            disabled={direction === "up" ? first : last}
            aria-label={direction === "up" ? "Премести нагоре" : "Премести надолу"}
          >
            {direction === "up" ? "↑" : "↓"}
          </button>
        </form>
      ))}
    </div>
  );
}
