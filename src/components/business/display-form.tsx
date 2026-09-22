import Link from "next/link";
import { deleteDisplayAction, regenerateDisplayTokenAction, saveDisplayAction } from "@/app/business/displays/actions";
import { ConfirmButton } from "@/components/business/confirm-button";
import { DisplayMediaField } from "@/components/business/display-media-field";
import { DisplayPreview } from "@/components/business/display-preview";
import { portalUi } from "@/components/business/ui";
import { displayThemes, displayUrl, shortDisplayAddress, type DisplayForEdit, type DisplayMediaOption } from "@/lib/business-platform/displays";
import type { MenuCategoryOption } from "@/lib/business-platform/menu";

const errorMessages: Record<string, string> = {
  name: "Дай име на екрана, например „Ляв телевизор“.",
  template: "Избери шаблон.",
  media: "За този шаблон трябва снимка или видео.",
  "media-kind": "Избраната медия не е от вида на шаблона: снимка за „Меню + снимка“, видео за „Меню + видео“.",
  categories: "Екранът е записан, но категориите не се записаха. Опитай пак.",
  save: "Записът не успя. Опитай пак.",
  delete: "Изтриването не успя."
};

const savedMessages: Record<string, string> = {
  "1": "Екранът е записан. Телевизорът ще го покаже до минута.",
  token: "Адресът е сменен. Въведи новия в телевизора; старият вече не работи."
};

export function DisplayForm({
  businessId,
  display,
  categories,
  media,
  error,
  saved
}: {
  businessId: string;
  display: DisplayForEdit | null;
  categories: MenuCategoryOption[];
  media: DisplayMediaOption[];
  error?: string;
  saved?: string;
}) {
  const chosen = new Set(display?.categoryIds ?? []);
  const url = display ? displayUrl(display.token) : null;

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Екрани</p>
        <h1 className={portalUi.h1}>{display ? display.name : "Нов екран"}</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Екранът показва менюто от „Меню“ – тук се избира само кои категории, кой шаблон и коя снимка или видео. Промените в
          менюто стигат до телевизора сами.
        </p>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          {savedMessages[saved] ?? "Записано."}
        </div>
      ) : null}

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
        </div>
      ) : null}

      {display && url ? (
        <section className={portalUi.card}>
          <h2 className={portalUi.h2}>Преглед</h2>
          <p className="mt-1 text-sm text-stone-650">Точно това е на телевизора: същата страница, смалена.</p>
          <div className="mt-4">
            <DisplayPreview src={`/display/${display.token}?preview=1`} refreshKey={`${display.updated_at}-${saved ?? ""}`} />
          </div>

          <div className="mt-5 grid gap-2 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
            <p className="font-semibold">Адрес за телевизора</p>
            {display.short_code ? (
              <p className="font-mono text-lg font-semibold tracking-wide text-forest">{shortDisplayAddress(display.short_code)}</p>
            ) : null}
            <p className={portalUi.hint}>
              Пише се веднъж в браузъра на телевизора (Samsung: „URL Launcher“; други: Android TV stick с kiosk браузър), с
              малки букви. Телевизорът сам минава на дългия таен адрес по-долу. В „Помощ“ има стъпки.
            </p>
            <p className="break-all font-mono text-[11px] text-stone-500">{url}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href={url} target="_blank" rel="noopener noreferrer" className={portalUi.smallButton}>
                Отвори на цял екран
              </a>
              <form action={regenerateDisplayTokenAction}>
                <input type="hidden" name="business_id" value={businessId} />
                <input type="hidden" name="id" value={display.id} />
                <ConfirmButton message="Да сменя ли адреса? И късият, и дългият стават нови; старите спират веднага и трябва да въведеш новия в телевизора." className={portalUi.smallButton}>
                  Смени адреса
                </ConfirmButton>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      <form action={saveDisplayAction} className={portalUi.card + " grid gap-5"}>
        <input type="hidden" name="business_id" value={businessId} />
        {display ? <input type="hidden" name="id" value={display.id} /> : null}

        <label className={portalUi.label}>
          <span>
            Име <span className={portalUi.hint}>само за теб, например „Ляв телевизор“</span>
          </span>
          <input name="name" defaultValue={display?.name ?? ""} required maxLength={60} className={portalUi.input} />
        </label>

        <DisplayMediaField options={media} initialMediaId={display?.media_id ?? null} initialTemplate={display?.template ?? "menu_only"} />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">Категории на този екран</legend>
          <p className={portalUi.hint}>Без отметка екранът показва цялото меню. Редът е като в „Меню“.</p>
          {categories.length === 0 ? (
            <p className="text-sm text-stone-650">
              Още няма категории.{" "}
              <Link href="/business/menu/categories/new" className="font-semibold text-forest underline underline-offset-4">
                Създай първата
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
                    <input type="checkbox" name="category_ids" value={category.id} defaultChecked={chosen.has(category.id)} className="h-4 w-4 accent-forest" />
                    <span className="font-semibold">{category.name}</span>
                    {!category.isActive ? <span className="text-xs text-stone-650">скрита</span> : null}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Тема</legend>
            <div className="flex gap-2">
              {displayThemes.map((theme) => (
                <label key={theme.value} className="flex items-center gap-2 rounded-full border border-[var(--stone)] bg-paper px-4 py-2 text-sm">
                  <input type="radio" name="theme" value={theme.value} defaultChecked={(display?.theme ?? "dark") === theme.value} className="accent-forest" />
                  {theme.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="show_descriptions" defaultChecked={display?.show_descriptions ?? false} className="h-4 w-4 accent-forest" />
              <span>
                Показвай описанията <span className={portalUi.hint}>заемат място; за малко артикули</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={display?.is_active ?? true} className="h-4 w-4 accent-forest" />
              <span>
                Активен <span className={portalUi.hint}>изключен екран показва „не е намерен“</span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={portalUi.primaryButton}>
            {display ? "Запази екрана" : "Създай екрана"}
          </button>
          <Link href="/business/displays" className={portalUi.secondaryButton}>
            Назад
          </Link>
        </div>
      </form>

      {display ? (
        <form action={deleteDisplayAction} className="flex justify-end">
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="id" value={display.id} />
          <ConfirmButton message={`Да изтрия ли „${display.name}“? Телевизорът ще покаже „не е намерен“.`} className={portalUi.dangerButton}>
            Изтрий екрана
          </ConfirmButton>
        </form>
      ) : null}
    </div>
  );
}
