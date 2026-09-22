"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Местата в портала. Модул без страница стои в колоната вляво като „скоро“, за
 * да се вижда какво идва; долната лента на телефона носи само готовите, иначе
 * не се чете.
 */
const items: { href: string; label: string; ready: boolean }[] = [
  { href: "/business", label: "Табло", ready: true },
  { href: "/business/menu", label: "Меню", ready: true },
  { href: "/business/hours", label: "Часове", ready: true },
  { href: "/business/displays", label: "Екрани", ready: true },
  { href: "/business/print", label: "Печат", ready: true },
  { href: "/business/branding", label: "Бранд", ready: true },
  { href: "/business/guide", label: "Помощ", ready: true }
];

export function BusinessNav({ variant }: { variant: "side" | "bottom" }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/business" ? pathname === href : pathname.startsWith(href));

  if (variant === "side") {
    return (
      <nav aria-label="Портал" className="mt-8 grid gap-1">
        {items.map((item) =>
          item.ready ? (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={
                isActive(item.href)
                  ? "rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-sage"
              }
            >
              {item.label}
            </Link>
          ) : (
            <span key={item.href} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-stone-650">
              {item.label}
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">скоро</span>
            </span>
          )
        )}
      </nav>
    );
  }

  const ready = items.filter((item) => item.ready);

  return (
    <nav
      aria-label="Портал"
      className="print:hidden fixed inset-x-0 bottom-0 z-20 border-t border-[var(--stone)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-4xl" style={{ gridTemplateColumns: `repeat(${ready.length}, minmax(0, 1fr))` }}>
        {ready.map((item) => (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={
                isActive(item.href)
                  ? "flex flex-1 flex-col items-center gap-0.5 px-1 py-3 text-xs font-semibold text-forest"
                  : "flex flex-1 flex-col items-center gap-0.5 px-1 py-3 text-xs font-medium text-stone-650"
              }
            >
              <span aria-hidden className={isActive(item.href) ? "h-1 w-6 rounded-full bg-forest" : "h-1 w-6 rounded-full bg-transparent"} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
