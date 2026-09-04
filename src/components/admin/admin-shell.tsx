import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Route } from "next";

const adminNav: { href: Route; label: string; badge?: "orders" }[] = [
  { href: "/admin", label: "Табло" },
  { href: "/admin/articles", label: "Статии" },
  { href: "/admin/cms", label: "Страници" },
  { href: "/admin/art-studio", label: "Art Studio" },
  { href: "/admin/art-studio/orders", label: "Поръчки", badge: "orders" },
  { href: "/admin/photos", label: "Фотоархив" },
  { href: "/admin/businesses", label: "Бизнеси" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/media", label: "Медия" },
  { href: "/admin/navigation", label: "Меню и хедър" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/guide", label: "Инструкции" }
];

/** Count of Art Studio orders still marked as new, shown next to the "Поръчки" tab. */
async function countNewOrders() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return 0;
    const { count } = await supabase.from("art_studio_orders").select("id", { count: "exact", head: true }).eq("production_status", "new").is("archived_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const newOrders = await countNewOrders();
  const navLinkClass = "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--admin-ink)] transition hover:bg-forest hover:text-white";

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-ink)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--admin-line)] bg-[var(--admin-side)] p-6 lg:block">
        <Link href="/" className="font-serif text-2xl font-semibold text-forest">
          Bansko NOW
        </Link>
        <nav className="mt-10 grid gap-1.5">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass}>
              <span>{item.label}</span>
              {item.badge === "orders" && newOrders > 0 ? (
                <span className="rounded-full bg-clay px-2 py-0.5 text-xs font-semibold text-white">{newOrders}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="absolute bottom-6 left-6 right-6">
          <button className="admin-button admin-button-secondary w-full px-4 py-2 text-sm font-semibold">
            Изход
          </button>
        </form>
      </aside>
      <div className="lg:pl-64">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-line)] bg-[var(--admin-bg)] px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="font-serif text-xl font-semibold text-forest lg:hidden">
            Bansko NOW
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin/art-studio/orders" className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold lg:hidden">
              Поръчки{newOrders > 0 ? ` (${newOrders})` : ""}
            </Link>
            <Link href="/admin/articles/new" className="admin-button admin-button-primary px-5 py-2 text-sm font-semibold">
              Нова статия
            </Link>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
