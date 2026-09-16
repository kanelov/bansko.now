import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { businessSignInAction } from "@/app/business/actions";
import { getBusinessSession } from "@/lib/business-platform/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Вход"
};

const errorMessages: Record<string, string> = {
  "invalid-login": "Неуспешен вход. Провери имейла и паролата.",
  "missing-fields": "Въведи имейл и парола.",
  "missing-env": "Порталът не е свързан с базата. Пиши на Bansko NOW.",
  "no-business": "Този акаунт не е свързан с бизнес. Достъпът се дава от Bansko NOW.",
  "not-owner": "Този акаунт няма права на собственик. Пиши на Bansko NOW."
};

export default async function BusinessLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getBusinessSession();

  if (session && session.memberships.length > 0) {
    redirect("/business");
  }

  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--stone)] bg-white p-8 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Bansko NOW</p>
        <h1 className="font-display mt-4 text-4xl font-semibold text-forest">Вход за бизнеси</h1>
        <p className="mt-3 text-sm leading-6 text-stone-650">
          Тук собственикът управлява менюто, екраните и печата на своето заведение. Достъпът се дава от Bansko NOW —
          регистрация няма.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-2xl bg-clay/15 p-4 text-sm">Липсват настройките за базата. Пиши на Bansko NOW.</div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl bg-clay/15 p-4 text-sm" role="alert">
            {errorMessages[error] ?? errorMessages["invalid-login"]}
          </div>
        ) : null}

        <form action={businessSignInAction} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Имейл
            <input
              id="business-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              className="rounded-xl border border-[var(--stone)] bg-paper px-4 py-3 text-base text-stone-950 outline-none focus:border-forest"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Парола
            <input
              id="business-password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="rounded-xl border border-[var(--stone)] bg-paper px-4 py-3 text-base text-stone-950 outline-none focus:border-forest"
            />
          </label>
          <button className="mt-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
            Вход
          </button>
        </form>
      </div>
    </main>
  );
}
