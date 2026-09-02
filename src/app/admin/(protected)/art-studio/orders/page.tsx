import Link from "next/link";
import { archiveArtStudioOrderAction, updateArtStudioOrderAction } from "@/app/admin/art-studio-actions";
import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { getArtStudioOrders } from "@/lib/art-studio";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<{ saved?: string; error?: string; tab?: string }>;

const dateFormat = new Intl.DateTimeFormat("bg-BG", { dateStyle: "short", timeStyle: "short" });

export default async function AdminArtStudioOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, orders] = await Promise.all([searchParams, getArtStudioOrders()]);
  const tab = params.tab === "history" ? "history" : "active";
  const activeOrders = orders.filter((order) => !order.archived_at);
  const historyOrders = orders.filter((order) => Boolean(order.archived_at));
  const visibleOrders = tab === "history" ? historyOrders : activeOrders;
  const admin = createSupabaseAdminClient();
  const attachmentLinks = new Map<string, string>();
  if (admin) {
    for (const order of orders) {
      if (!order.attachment_path) continue;
      const { data } = await admin.storage.from("art-studio-orders").createSignedUrl(order.attachment_path, 60 * 60);
      if (data?.signedUrl) attachmentLinks.set(order.id, data.signedUrl);
    }
  }
  return (
    <div className="grid gap-8">
      <header className="grid gap-4">
        <div><p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Art Studio</p><h1 className="mt-2 font-serif text-4xl font-semibold">Поръчки</h1></div>
        <ArtStudioAdminNav />
        <nav className="flex flex-wrap gap-2" aria-label="Поръчки: активни и история">
          <Link href="/admin/art-studio/orders" className="admin-tab" aria-selected={tab === "active"} role="tab">Активни ({activeOrders.length})</Link>
          <Link href="/admin/art-studio/orders?tab=history" className="admin-tab" aria-selected={tab === "history"} role="tab">История ({historyOrders.length})</Link>
        </nav>
        <p className="max-w-3xl text-sm text-[var(--admin-muted)]">
          В „История“ отиват поръчките, които са отказани, изтрити или получени в приложението за заявки, както и завършените или отказаните от тук. Могат да се върнат в активните с един бутон.
        </p>
      </header>
      {params.saved ? <p className="rounded-xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-900">Статусът е обновен.</p> : null}
      {params.error ? <p className="rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-900">{params.error}</p> : null}
      <div className="grid gap-4">
        {visibleOrders.map((order) => {
          const snapshot = order.product_snapshot && typeof order.product_snapshot === "object" && !Array.isArray(order.product_snapshot) ? order.product_snapshot as Record<string, unknown> : {};
          return (
            <details key={order.id} className="rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-5">
              <summary className="cursor-pointer list-none">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                  <div><p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">{order.order_number}</p><h2 className="mt-1 font-serif text-2xl font-semibold">{String(snapshot.title || "Art Studio продукт")}</h2></div>
                  <p className="text-sm text-[var(--admin-muted)]">{order.customer_first_name} {order.customer_last_name}<br />{order.customer_email}</p>
                  <span className="rounded-full bg-[var(--admin-panel-strong)] px-3 py-1 text-xs font-semibold">{order.archived_at ? order.archive_reason || "в историята" : order.request_type === "enquiry" ? "заявка" : order.payment_status}</span>
                  <strong>{Number(order.total).toFixed(2)} {order.currency}</strong>
                </div>
              </summary>
              <div className="mt-5 grid gap-5 rounded-2xl bg-white p-5 text-stone-950 lg:grid-cols-2">
                <div className="grid gap-2 text-sm">
                  <p><strong>Телефон:</strong> {order.customer_phone}</p>
                  <p><strong>Количество:</strong> {order.quantity}</p>
                  <p><strong>Име/текст:</strong> {order.personalization_text || "—"}</p>
                  <p><strong>Бележка:</strong> {order.idea_note || "—"}</p>
                  <p><strong>Опции:</strong> {order.selected_options && typeof order.selected_options === "object" && !Array.isArray(order.selected_options)
                    ? Object.values(order.selected_options as Record<string, unknown>).map((value) => {
                        const item = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
                        return item ? `${String(item.field || "")}: ${String(item.label || item.value || "")}` : String(value);
                      }).join(" · ") || "—"
                    : "—"}</p>
                  <p><strong>Тип:</strong> {order.request_type === "enquiry" ? "Заявка през формата (без предплащане)" : "Онлайн плащане"}</p>
                  <p><strong>В приложението за заявки:</strong> {order.source_request_id
                    ? `Добавена автоматично${order.source_synced_at ? ` (${new Date(order.source_synced_at).toLocaleString("bg-BG")})` : ""}`
                    : "Не е добавена автоматично, въведи я ръчно"}</p>
                  {order.attachment_path ? (
                    <p><strong>Снимка от клиента:</strong> {attachmentLinks.get(order.id) ? <a href={attachmentLinks.get(order.id)} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline">Отвори (линкът е валиден 1 час)</a> : order.attachment_path}</p>
                  ) : null}
                </div>
                <div className="grid gap-2 text-sm">
                  <p><strong>Доставка:</strong> {order.delivery_method === "econt_office" ? "Еконт" : "Взимане от галерията"}</p>
                  <p><strong>Град:</strong> {order.delivery_city || "—"}</p>
                  <p><strong>Офис:</strong> {order.delivery_office || "—"}</p>
                  <p><strong>Бележка:</strong> {order.delivery_notes || "—"}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm lg:col-span-2">
                  <p>
                    <strong>История:</strong>{" "}
                    {order.archived_at
                      ? `${order.archive_reason || "в историята"} · ${dateFormat.format(new Date(order.archived_at))}`
                      : "активна поръчка"}
                    {order.source_status ? ` · последен статус от приложението: ${order.source_status}` : ""}
                  </p>
                  <form action={archiveArtStudioOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="archive" value={order.archived_at ? "0" : "1"} />
                    <button className="admin-button admin-button-secondary px-4 py-2 text-xs font-semibold">{order.archived_at ? "Върни в активните" : "В историята"}</button>
                  </form>
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
        {!visibleOrders.length ? (
          <p className="rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6 text-sm text-[var(--admin-muted)]">
            {tab === "history" ? "Историята е празна." : "Няма активни Art Studio поръчки."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
