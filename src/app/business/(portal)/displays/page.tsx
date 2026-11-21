import type { Metadata } from "next";
import Link from "next/link";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { refreshDisplaysAction } from "@/app/business/displays/actions";
import { displayTemplates, listDisplays, shortDisplayAddress } from "@/lib/business-platform/displays";

export const metadata: Metadata = {
  title: "Екрани"
};

const savedMessages: Record<string, string> = {
  deleted: "Екранът е изтрит.",
  refresh: "Готово. Телевизорите ще се опреснят до 2 минути."
};

const errorMessages: Record<string, string> = {
  delete: "Изтриването не успя. Опитай пак.",
  missing: "Не намерих екрана.",
  refresh: "Опресняването не успя. Опитай пак след малко."
};

function templateLabel(value: string) {
  return displayTemplates.find((template) => template.value === value)?.label ?? value;
}

export default async function BusinessDisplaysPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const displays = await listDisplays(supabase, business.businessId);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={portalUi.eyebrow}>Екрани</p>
          <h1 className={portalUi.h1}>Телевизорите в заведението</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-650">
            Всеки телевизор има свой номер. Телевизорите се зареждат сами 3 пъти на ден (06, 12 и 18 ч.). След промяна в менюто
            или в слайдовете натисни „Опресни телевизорите“ – виждат я до 2 минути.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {displays.length ? (
            <form action={refreshDisplaysAction}>
              <input type="hidden" name="business_id" value={business.businessId} />
              <button type="submit" className={portalUi.primaryButton}>
                Опресни телевизорите
              </button>
            </form>
          ) : null}
          <Link href="/business/displays/new" className={portalUi.secondaryButton}>
            Нов екран
          </Link>
        </div>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          {savedMessages[saved] ?? "Записано."}
        </div>
      ) : null}

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? "Нещо не мина. Опитай пак."}
        </div>
      ) : null}

      {displays.length === 0 ? (
        <section className={portalUi.card}>
          <h2 className={portalUi.h2}>Още няма екрани</h2>
          <p className="mt-2 text-sm text-stone-650">
            Създай екран, избери категориите и шаблона, после въведи адреса му в браузъра на телевизора. В „Помощ“ има стъпки
            за Samsung и за обикновен телевизор.
          </p>
          <Link href="/business/displays/new" className={portalUi.primaryButton + " mt-4"}>
            Създай първия екран
          </Link>
        </section>
      ) : (
        <ul className="grid gap-3">
          {displays.map((display) => (
            <li key={display.id} className={portalUi.card + " flex flex-wrap items-center justify-between gap-4"}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={portalUi.h2}>{display.name}</h2>
                  {!display.is_active ? (
                    <span className={portalUi.badge + " bg-stone-200 text-stone-650"}>изключен</span>
                  ) : display.online ? (
                    <span className={portalUi.badge + " bg-sage text-forest"}>свързан</span>
                  ) : (
                    <span className={portalUi.badge + " bg-clay/15 text-clay"}>{display.last_seen_at ? "няма връзка" : "не е включван"}</span>
                  )}
                  {display.short_code ? <span className="font-mono text-sm font-semibold text-forest">{shortDisplayAddress(display.short_code)}</span> : null}
                </div>
                <p className="mt-1 text-sm text-stone-650">
                  {templateLabel(display.template)} · {display.theme === "dark" ? "тъмна" : "светла"} ·{" "}
                  {display.categoryNames.length ? display.categoryNames.join(", ") : "цялото меню"}
                </p>
              </div>
              <Link href={`/business/displays/${display.id}`} className={portalUi.secondaryButton}>
                Настрой
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
