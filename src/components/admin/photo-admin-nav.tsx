import Link from "next/link";

const items = [
  { href: "/admin/photos", label: "Фотографии" },
  { href: "/admin/photos/copy", label: "Текстове и лицензи" }
];

export function PhotoAdminNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Фотоархив администрация">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
