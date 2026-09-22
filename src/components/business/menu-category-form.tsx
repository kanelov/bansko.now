import Link from "next/link";
import { deleteMenuCategoryAction, saveMenuCategoryAction } from "@/app/business/menu/actions";
import { ConfirmButton } from "@/components/business/confirm-button";
import { portalUi } from "@/components/business/ui";
import type { MenuCategoryForEdit } from "@/lib/business-platform/menu";
import { guessMenuCategoryIcon, menuCategoryIconOptions } from "@/lib/business-platform/menu-icons";
import { IconGlyph } from "@/components/public/icon-glyph";

const errorMessages: Record<string, string> = {
  name: "Името на български е задължително.",
  save: "Записът не успя. Опитай пак.",
  delete: "Изтриването не успя. Опитай пак."
};

export function MenuCategoryForm({
  businessId,
  category,
  error
}: {
  businessId: string;
  category: MenuCategoryForEdit | null;
  error?: string;
}) {
  const bg = category?.translations.find((row) => row.locale === "bg");
  const en = category?.translations.find((row) => row.locale === "en");
  const guessed = guessMenuCategoryIcon({ bg: bg?.name, en: en?.name });
  const guessedLabel = menuCategoryIconOptions.find((option) => option.name === guessed)?.label ?? guessed;

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Меню</p>
        <h1 className={portalUi.h1}>{category ? "Категория" : "Нова категория"}</h1>
        <p className="mt-2 text-sm text-stone-650">Например „Кафе“, „Топли напитки“, „Кроасани“. Редът се сменя от списъка.</p>
      </header>

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
        </div>
      ) : null}

      <form action={saveMenuCategoryAction} className={portalUi.card + " grid gap-5"}>
        <input type="hidden" name="business_id" value={businessId} />
        {category ? <input type="hidden" name="id" value={category.id} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={portalUi.label}>
            <span>
              Име <span className={portalUi.hint}>на български</span>
            </span>
            <input id="category-name-bg" name="name_bg" defaultValue={bg?.name ?? ""} required maxLength={80} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>
              Име <span className={portalUi.hint}>на английски, по желание</span>
            </span>
            <input id="category-name-en" name="name_en" defaultValue={en?.name ?? ""} maxLength={80} className={portalUi.input} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={portalUi.label}>
            <span>
              Описание <span className={portalUi.hint}>BG, по желание</span>
            </span>
            <textarea id="category-description-bg" name="description_bg" defaultValue={bg?.description ?? ""} maxLength={300} className={portalUi.textarea} />
          </label>
          <label className={portalUi.label}>
            <span>
              Описание <span className={portalUi.hint}>EN, по желание</span>
            </span>
            <textarea id="category-description-en" name="description_en" defaultValue={en?.description ?? ""} maxLength={300} className={portalUi.textarea} />
          </label>
        </div>

        <div className="grid gap-2">
          <label className={portalUi.label}>
            <span>
              Иконка <span className={portalUi.hint}>пред името на категорията - на телевизора, в QR менюто и на печат</span>
            </span>
            <select id="category-icon" name="icon_name" defaultValue={category?.icon_name ?? ""} className={portalUi.input}>
              <option value="">Автоматично по името{category ? ` (сега: ${guessedLabel})` : ""}</option>
              {menuCategoryIconOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 text-forest" aria-hidden>
            {menuCategoryIconOptions.map((option) => (
              <span key={option.name} title={option.label} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--stone)] bg-white">
                <IconGlyph name={option.name} className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input id="category-active" type="checkbox" name="is_active" defaultChecked={category ? category.is_active : true} className="h-5 w-5 accent-forest" />
          <span>
            Видима <span className={portalUi.hint}>(скрита категория не излиза никъде, но артикулите ѝ се пазят)</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button className={portalUi.primaryButton}>Запази</button>
          <Link href="/business/menu" className={portalUi.secondaryButton}>
            Откажи
          </Link>
        </div>
      </form>

      {category ? (
        <form action={deleteMenuCategoryAction} className="flex justify-end">
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="id" value={category.id} />
          <ConfirmButton message="Изтриване на категорията заедно с всичките ѝ артикули. Сигурен ли си?" className={portalUi.dangerButton}>
            Изтрий категорията
          </ConfirmButton>
        </form>
      ) : null}
    </div>
  );
}
