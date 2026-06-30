import type { Metadata } from "next";
import { signInAction } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: {
    absolute: "Admin Login | Bansko NOW"
  }
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  const errorMessage =
    error === "not-admin"
      ? "Този потребител няма admin права. Добави `role: admin` в Supabase app metadata."
      : "Неуспешен вход. Провери имейла, паролата и Supabase настройките.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="font-serif text-3xl font-semibold">Bansko NOW</p>
        <h1 className="mt-8 font-serif text-4xl font-semibold">Admin login</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Вход само за администратори. Публична регистрация няма.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-2xl bg-clay/20 p-4 text-sm text-stone-100">
            Липсват Supabase environment variables. Добави ги в `.env.local` преди вход.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl bg-clay/20 p-4 text-sm text-stone-100">
            {errorMessage}
          </div>
        ) : null}

        <form action={signInAction} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input
              type="email"
              name="email"
              className="rounded-xl border border-white/15 bg-white px-4 py-3 text-stone-950"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Password
            <input
              type="password"
              name="password"
              className="rounded-xl border border-white/15 bg-white px-4 py-3 text-stone-950"
              required
            />
          </label>
          <button className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950">
            Вход
          </button>
        </form>
      </div>
    </main>
  );
}
