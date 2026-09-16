import Link from "next/link";
import { businessSignOutAction } from "@/app/business/actions";
import type { BusinessMembership } from "@/lib/business-platform/auth";
import { BusinessNav } from "@/components/business/business-nav";

/**
 * Рамката на портала: горе името на бизнеса и изход, долу лента с петте
 * места за телефон (на широк екран - колона вляво). Нарочно няма нищо общо с
 * AdminShell: собственикът трябва да вижда своя спокоен инструмент, не орязан
 * админ.
 */
export function BusinessShell({
  business,
  memberships,
  children
}: {
  business: BusinessMembership;
  memberships: BusinessMembership[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[var(--stone)] bg-white/60 px-5 py-6 lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Bansko NOW</p>
        <p className="font-display mt-1 text-lg font-semibold text-forest">Бизнес</p>
        <BusinessNav variant="side" />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--stone)] bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss lg:hidden">Bansko NOW · Бизнес</p>
              <p className="truncate text-sm font-semibold">{business.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {memberships.length > 1 ? (
                <Link
                  href="/business/select"
                  className="rounded-full border border-[var(--stone)] bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-forest"
                >
                  Смени
                </Link>
              ) : null}
              <form action={businessSignOutAction}>
                <button className="rounded-full border border-[var(--stone)] bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-forest">
                  Изход
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>

        <BusinessNav variant="bottom" />
      </div>
    </div>
  );
}
