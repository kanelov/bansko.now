import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { businessSignOutAction, selectBusinessAction } from "@/app/business/actions";
import { getBusinessSession } from "@/lib/business-platform/auth";

export const metadata: Metadata = {
  title: "Избор на бизнес"
};

/* Само при повече от един бизнес: при един порталът го избира сам. */
export default async function SelectBusinessPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getBusinessSession();

  if (!session) {
    redirect("/business/login");
  }

  if (session.memberships.length === 0) {
    redirect("/business/login?error=no-business");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--stone)] bg-white p-8 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Bansko NOW</p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-forest">Кой бизнес отваряш?</h1>

        {error ? (
          <div className="mt-6 rounded-2xl bg-clay/15 p-4 text-sm" role="alert">
            Този бизнес не е сред твоите. Избери от списъка.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          {session.memberships.map((membership) => (
            <form key={membership.businessId} action={selectBusinessAction}>
              <input type="hidden" name="business_id" value={membership.businessId} />
              <button className="flex w-full items-center justify-between rounded-2xl border border-[var(--stone)] bg-paper px-5 py-4 text-left text-base font-semibold transition hover:border-forest">
                <span>{membership.name}</span>
                <span aria-hidden className="text-moss">
                  →
                </span>
              </button>
            </form>
          ))}
        </div>

        <form action={businessSignOutAction} className="mt-8">
          <button className="text-sm font-semibold text-stone-650 underline-offset-4 hover:underline">Изход</button>
        </form>
      </div>
    </main>
  );
}
