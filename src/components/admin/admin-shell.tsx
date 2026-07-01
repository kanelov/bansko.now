import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import type { Route } from "next";

const adminNav: { href: Route; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-stone-950 p-6 lg:block">
        <Link href="/" className="font-serif text-2xl font-semibold">
          Bansko NOW
        </Link>
        <nav className="mt-10 grid gap-2">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
              {item.label}
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
        <header className="flex items-center justify-between border-b border-white/10 bg-stone-950 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="font-serif text-xl font-semibold lg:hidden">
            Bansko NOW
          </Link>
          <Link href="/admin/articles/new" className="admin-button admin-button-primary px-5 py-2 text-sm font-semibold">
            New Article
          </Link>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
