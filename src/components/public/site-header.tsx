import Link from "next/link";
import type { Route } from "next";

const navItems: { href: string; label: string }[] = [
  { href: "/now", label: "Сега" },
  { href: "/events", label: "Събития" },
  { href: "/explore", label: "Открий Банско" },
  { href: "/nature", label: "Природа" },
  { href: "/culture", label: "Култура" },
  { href: "/living", label: "Живот" },
  { href: "/food", label: "Храна" },
  { href: "/art-studio", label: "Art Studio" },
  { href: "/bansko-collection", label: "Bansko Collection" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[rgba(250,248,242,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold text-forest">
          Bansko NOW
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-stone-700 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as Route} className="transition hover:text-forest">
              {item.label}
            </Link>
          ))}
          <a href="#community" className="transition hover:text-forest">
            Общност
          </a>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/articles"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-forest hover:text-forest"
          >
            Всички статии
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm text-stone-400 shadow-soft">
            Търсене
          </span>
        </div>

        <details className="group relative lg:hidden">
          <summary className="list-none rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
            Меню
          </summary>
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-stone-200 bg-paper p-3 shadow-xl">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/articles" className="rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
                Всички статии
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
