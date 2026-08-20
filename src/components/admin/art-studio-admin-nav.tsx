import Link from "next/link";

const items = [
  { href: "/admin/art-studio", label: "Преглед" },
  { href: "/admin/art-studio/gallery", label: "Онлайн галерия" },
  { href: "/admin/art-studio/products", label: "Каталог" },
  { href: "/admin/art-studio/orders", label: "Поръчки" },
  { href: "/admin/art-studio/settings", label: "Доставка" }
];

export function ArtStudioAdminNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Art Studio администрация">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
