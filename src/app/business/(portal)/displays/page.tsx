import type { Metadata } from "next";
import Link from "next/link";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { displayTemplates, listDisplays } from "@/lib/business-platform/displays";

export const metadata: Metadata = {
  title: "Екрани"
};

const savedMessages: Record<string, string> = {
  deleted: "Екранът е изтрит."
};

const errorMessages: Record<string, string> = {
  delete: "Изтриването не успя. Опитай пак.",
  missing: "Не намерих екрана."
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
            Всеки телевизор има свой адрес и показва избрани категории от менюто. Промяна в „Меню“ стига до всички екрани до
            минута, без да пипаш нищо тук.
          </p>
        </div>
        <Link href="/business/displays/new" className={portalUi.primaryButton}>
          Нов екран
        </Link>
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
                    <span className={portalUi.badge + " bg-sage text-forest"}>онлайн</span>
                  ) : (
                    <span className={portalUi.badge + " bg-clay/15 text-clay"}>{display.last_seen_at ? "офлайн" : "не е включван"}</span>
                  )}
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
