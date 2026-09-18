import { changeAdminPasswordAction } from "@/app/admin/account-actions";

type SearchParams = Promise<{ saved?: string; error?: string }>;

const errorMessages: Record<string, string> = {
  short: "Паролата трябва да е поне 10 знака.",
  mismatch: "Двете полета не съвпадат.",
  save: "Паролата не се смени. Опитай пак."
};

const fieldClass = "w-full rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 text-sm text-stone-950";

/** Админ „Парола“: смяна на паролата на акаунта, с който си влязъл. */
export default async function AdminAccountPage({ searchParams }: { searchParams: SearchParams }) {
  const { saved, error } = await searchParams;

  return (
    <div className="grid max-w-xl gap-6">
      <div className="grid gap-3">
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Акаунт</p>
        <h1 className="font-serif text-4xl font-semibold">Смяна на парола</h1>
        <p className="text-sm leading-6 text-[var(--admin-muted)]">
          Това е паролата на акаунта, с който влизаш в админа. Същият акаунт отваря и бизнес портала (<code>/business</code>), затова
          паролата е една и за двете места. Собствениците на заведения имат свои отделни акаунти – техните пароли се дават и сменят от
          „Бизнес платформа“.
        </p>
      </div>

      {saved ? <div className="rounded-2xl border border-emerald-300 bg-emerald-100 p-4 text-sm font-semibold text-emerald-950">Паролата е сменена. Важи и за бизнес портала.</div> : null}
      {error ? <div className="rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">{errorMessages[error] ?? errorMessages.save}</div> : null}

      <form action={changeAdminPasswordAction} className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-5">
        <label className="grid gap-1 text-xs font-semibold text-stone-700">
          Нова парола (поне 10 знака)
          <input type="password" name="password" required minLength={10} autoComplete="new-password" className={fieldClass} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-stone-700">
          Повтори я
          <input type="password" name="password_repeat" required minLength={10} autoComplete="new-password" className={fieldClass} />
        </label>
        <button className="admin-button admin-button-primary w-fit px-5 py-2.5 text-sm font-semibold">Смени паролата</button>
      </form>
    </div>
  );
}
