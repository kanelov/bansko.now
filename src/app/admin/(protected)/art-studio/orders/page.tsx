import { updateArtStudioOrderAction } from "@/app/admin/art-studio-actions";
import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { getArtStudioOrders } from "@/lib/art-studio";

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function AdminArtStudioOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, orders] = await Promise.all([searchParams, getArtStudioOrders()]);
  return (
    <div className="grid gap-8">
      <header className="grid gap-4">
        <div><p className="text-sm font-semibold uppercase text-stone-400">Art Studio</p><h1 className="mt-2 font-serif text-4xl font-semibold">Поръчки</h1></div>
        <ArtStudioAdminNav />
      </header>
      {params.saved ? <p className="rounded-xl bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-100">Статусът е обновен.</p> : null}
      {params.error ? <p className="rounded-xl bg-red-500/10 p-4 text-sm font-semibold text-red-100">{params.error}</p> : null}
      <div className="grid gap-4">
        {orders.map((order) => {
          const snapshot = order.product_snapshot && typeof order.product_snapshot === "object" && !Array.isArray(order.product_snapshot) ? order.product_snapshot as Record<string, unknown> : {};
          return (
            <details key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <summary className="cursor-pointer list-none">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                  <div><p className="text-xs font-semibold uppercase text-stone-400">{order.order_number}</p><h2 className="mt-1 font-serif text-2xl font-semibold">{String(snapshot.title || "Art Studio продукт")}</h2></div>
                  <p className="text-sm text-stone-300">{order.customer_first_name} {order.customer_last_name}<br />{order.customer_email}</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{order.payment_status}</span>
                  <strong>{Number(order.total).toFixed(2)} {order.currency}</strong>
                </div>
              </summary>
              <div className="mt-5 grid gap-5 rounded-2xl bg-white p-5 text-stone-950 lg:grid-cols-2">
                <div className="grid gap-2 text-sm">
                  <p><strong>Телефон:</strong> {order.customer_phone}</p>
                  <p><strong>Количество:</strong> {order.quantity}</p>
                  <p><strong>Име/текст:</strong> {order.personalization_text || "—"}</p>
                  <p><strong>Бележка:</strong> {order.idea_note || "—"}</p>
                  <p><strong>Опции:</strong> {JSON.stringify(order.selected_options)}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <p><strong>Доставка:</strong> {order.delivery_method === "econt_office" ? "Еконт" : "Взимане от галерията"}</p>
                  <p><strong>Град:</strong> {order.delivery_city || "—"}</p>
                  <p><strong>Офис:</strong> {order.delivery_office || "—"}</p>
                  <p><strong>Бележка:</strong> {order.delivery_notes || "—"}</p>
                </div>
                <form action={updateArtStudioOrderAction} className="grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-[1fr_1fr_auto] lg:col-span-2">
                  <input type="hidden" name="id" value={order.id} />
                  <select name="payment_status" defaultValue={order.payment_status} className="rounded-xl border border-stone-300 px-4 py-3 text-sm">
                    <option value="pending">Очаква плащане</option><option value="paid">Платена</option><option value="failed">Неуспешна</option><option value="expired">Изтекла</option><option value="refunded">Възстановена</option>
                  </select>
                  <select name="production_status" defaultValue={order.production_status} className="rounded-xl border border-stone-300 px-4 py-3 text-sm">
                    <option value="new">Нова</option><option value="in_production">В производство</option><option value="ready_for_pickup">Готова</option><option value="shipped">Изпратена</option><option value="completed">Завършена</option><option value="cancelled">Отказана</option>
                  </select>
                  <button className="admin-button admin-button-forest px-4 py-2 text-sm font-semibold">Запази</button>
                </form>
              </div>
            </details>
          );
        })}
        {!orders.length ? <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-stone-300">Все още няма Art Studio поръчки.</p> : null}
      </div>
    </div>
  );
}
