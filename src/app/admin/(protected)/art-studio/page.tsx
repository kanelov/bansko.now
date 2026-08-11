import Link from "next/link";
import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { getArtStudioOrders, getArtStudioProducts, getArtStudioProductTypes } from "@/lib/art-studio";
import { stripeSecretKey, stripeWebhookSecret, supabaseServiceRoleKey } from "@/lib/env";

export default async function AdminArtStudioPage() {
  const [productTypes, products, orders] = await Promise.all([
    getArtStudioProductTypes({ locale: "bg", includeInactive: true }),
    getArtStudioProducts({ locale: "bg", includeInactive: true }),
    getArtStudioOrders()
  ]);
  const paidOrders = orders.filter((order) => order.payment_status === "paid").length;
  const productionOrders = orders.filter((order) => ["new", "in_production"].includes(order.production_status)).length;

  return (
    <div className="grid gap-8">
      <header className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Bansko NOW</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Art Studio</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">Продукти, цени, Stripe Payment Links, доставка и поръчки в един лек модул.</p>
        </div>
        <ArtStudioAdminNav />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Продуктови типове", productTypes.length],
          ["Продукти", products.length],
          ["Платени поръчки", paidOrders],
          ["За производство", productionOrders]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-stone-400">{label}</p>
            <p className="mt-2 font-serif text-4xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 rounded-2xl bg-white p-6 text-stone-950 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Статус</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Готовност за поръчки</h2>
          <div className="mt-5 grid gap-2 text-sm">
            <p><strong>Supabase server key:</strong> {supabaseServiceRoleKey ? "настроен" : "липсва"}</p>
            <p><strong>Stripe secret key:</strong> {stripeSecretKey ? "настроен" : "липсва"}</p>
            <p><strong>Stripe webhook secret:</strong> {stripeWebhookSecret ? "настроен" : "липсва"}</p>
          </div>
        </div>
        <Link href="/admin/art-studio/products" className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">Управление на каталога</Link>
      </section>
    </div>
  );
}
