import Link from "next/link";
import { deleteMenuCategoryAction, saveMenuCategoryAction } from "@/app/business/menu/actions";
import { ConfirmButton } from "@/components/business/confirm-button";
import { portalUi } from "@/components/business/ui";
import type { MenuCategoryForEdit } from "@/lib/business-platform/menu";

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
