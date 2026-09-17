import type { Metadata } from "next";
import { changeBusinessPasswordAction } from "@/app/business/actions";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";

export const metadata: Metadata = {
  title: "Парола"
};

const errorMessages: Record<string, string> = {
  short: "Паролата трябва да е поне 10 знака.",
  mismatch: "Двете полета не съвпадат.",
  save: "Паролата не се смени. Опитай пак."
};

/** Акаунтът идва от Bansko NOW с временна парола; тук собственикът слага своя. */
export default async function BusinessAccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  await requireBusinessOwner();

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Акаунт</p>
        <h1 className={portalUi.h1}>Смяна на парола</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Акаунтът ти е създаден от Bansko NOW с временна парола. Смени я с твоя – поне 10 знака. Ако я забравиш, пиши ни и ще получиш нова.
        </p>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          Паролата е сменена.
        </div>
      ) : null}
      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
        </div>
      ) : null}

      <form action={changeBusinessPasswordAction} className={portalUi.card + " grid max-w-md gap-4"}>
        <label className={portalUi.label}>
          Нова парола
          <input type="password" name="password" required minLength={10} autoComplete="new-password" className={portalUi.input} />
        </label>
        <label className={portalUi.label}>
          Повтори я
          <input type="password" name="password_repeat" required minLength={10} autoComplete="new-password" className={portalUi.input} />
        </label>
        <div>
          <button type="submit" className={portalUi.primaryButton}>
            Смени паролата
          </button>
        </div>
      </form>
    </div>
  );
}
