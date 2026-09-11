import Link from "next/link";

const items = [
  { href: "/admin/settings", label: "Общи" },
  { href: "/admin/settings/fallback-images", label: "Снимки по подразбиране" }
];

export function SettingsNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Настройки">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
