import Link from "next/link";
import { deleteMenuItemAction, saveMenuItemAction } from "@/app/business/menu/actions";
import { ConfirmButton } from "@/components/business/confirm-button";
import { MenuImageField } from "@/components/business/menu-image-field";
import { MenuPriceFields, type VariantRow } from "@/components/business/menu-price-fields";
import { portalUi } from "@/components/business/ui";
import { businessMediaUrls } from "@/lib/business-platform/media";
import type { MenuItemForEdit } from "@/lib/business-platform/menu";
import { centsToInput } from "@/lib/business-platform/money";

const errorMessages: Record<string, string> = {
  name: "Името на български е задължително.",
  category: "Избери категория.",
  price: "Въведи цена, например 3,90.",
  "variant-name": "Всеки вариант има нужда от име на български.",
  "variant-price": "Всеки вариант има нужда от цена, например 2,90.",
  media: "Снимката не е разпозната. Качи я отново.",
  save: "Записът не успя. Опитай пак.",
  delete: "Изтриването не успя. Опитай пак."
};

export function MenuItemForm({
  businessId,
  categories,
  item,
  defaultCategoryId,
  error
}: {
  businessId: string;
  categories: { id: string; name: string }[];
  item: MenuItemForEdit | null;
  defaultCategoryId?: string | null;
  error?: string;
}) {
  const bg = item?.translations.find((row) => row.locale === "bg");
  const en = item?.translations.find((row) => row.locale === "en");
  const variants: VariantRow[] = (item?.variants ?? []).map((variant) => ({
    key: variant.id,
    id: variant.id,
    nameBg: variant.translations.find((row) => row.locale === "bg")?.name ?? "",
    nameEn: variant.translations.find((row) => row.locale === "en")?.name ?? "",
    price: centsToInput(variant.price_cents),
    active: variant.is_active
  }));
  const image = item?.media ? { id: item.media.id, url: businessMediaUrls(item.media).w480 } : null;

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Меню</p>
        <h1 className={portalUi.h1}>{item ? "Артикул" : "Нов артикул"}</h1>
        <p className="mt-2 text-sm text-stone-650">Едно място за име, цена, снимка и наличност. Промяната стига навсякъде за под минута.</p>
      </header>

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
        </div>
      ) : null}

      <form action={saveMenuItemAction} className={portalUi.card + " grid gap-5"}>
        <input type="hidden" name="business_id" value={businessId} />
        {item ? <input type="hidden" name="id" value={item.id} /> : null}

        <label className={portalUi.label}>
          Категория
          <select
            id="item-category"
            name="category_id"
            defaultValue={item?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ""}
            required
            className={portalUi.input}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={portalUi.label}>
            <span>
              Име <span className={portalUi.hint}>на български</span>
            </span>
            <input id="item-name-bg" name="name_bg" defaultValue={bg?.name ?? ""} required maxLength={120} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>
              Име <span className={portalUi.hint}>на английски, по желание</span>
            </span>
            <input id="item-name-en" name="name_en" defaultValue={en?.name ?? ""} maxLength={120} className={portalUi.input} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={portalUi.label}>
            <span>
              Описание <span className={portalUi.hint}>BG, по желание</span>
            </span>
            <textarea id="item-description-bg" name="description_bg" defaultValue={bg?.description ?? ""} maxLength={500} className={portalUi.textarea} />
          </label>
          <label className={portalUi.label}>
            <span>
              Описание <span className={portalUi.hint}>EN, по желание</span>
            </span>
            <textarea id="item-description-en" name="description_en" defaultValue={en?.description ?? ""} maxLength={500} className={portalUi.textarea} />
          </label>
        </div>

        <MenuPriceFields initialPrice={centsToInput(item?.price_cents ?? null)} initialVariants={variants} />

        <MenuImageField initial={image} />

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Наличност</legend>
            <label className="flex items-center gap-2 text-sm">
              <input id="item-available" type="radio" name="availability" value="available" defaultChecked={(item?.availability ?? "available") === "available"} className="h-4 w-4 accent-forest" />
              Има го
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input id="item-sold-out" type="radio" name="availability" value="sold_out" defaultChecked={item?.availability === "sold_out"} className="h-4 w-4 accent-forest" />
              Свърши (SOLD OUT) <span className={portalUi.hint}>остава в менюто, зачертано</span>
            </label>
          </fieldset>

          <label className="flex items-start gap-3 text-sm">
            <input id="item-active" type="checkbox" name="is_active" defaultChecked={item ? item.is_active : true} className="mt-0.5 h-5 w-5 accent-forest" />
            <span>
              Видим <span className={portalUi.hint}>(скрит артикул не излиза никъде, но се пази)</span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={portalUi.label}>
            <span>
              Етикети <span className={portalUi.hint}>през запетая: веган, ново</span>
            </span>
            <input id="item-tags" name="tags" defaultValue={item?.tags.join(", ") ?? ""} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>
              Алергени <span className={portalUi.hint}>през запетая: глутен, мляко, ядки</span>
            </span>
            <input id="item-allergens" name="allergens" defaultValue={item?.allergens.join(", ") ?? ""} className={portalUi.input} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className={portalUi.primaryButton}>Запази</button>
          <Link href="/business/menu" className={portalUi.secondaryButton}>
            Откажи
          </Link>
        </div>
      </form>

      {item ? (
        <form action={deleteMenuItemAction} className="flex justify-end">
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="id" value={item.id} />
          <ConfirmButton message="Изтриване на артикула. Сигурен ли си?" className={portalUi.dangerButton}>
            Изтрий артикула
          </ConfirmButton>
        </form>
      ) : null}
    </div>
  );
}
