import { saveArtStudioSettingsAction } from "@/app/admin/art-studio-actions";
import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { getArtStudioPublicSettings } from "@/lib/art-studio";
import { adminNotificationEmail } from "@/lib/env";

type SearchParams = Promise<{ saved?: string; error?: string }>;
const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950";

export default async function AdminArtStudioSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, settings] = await Promise.all([searchParams, getArtStudioPublicSettings({ includeAdmin: true })]);
  return (
    <div className="grid gap-8">
      <header className="grid gap-4">
        <div><p className="text-sm font-semibold uppercase text-stone-400">Art Studio</p><h1 className="mt-2 font-serif text-4xl font-semibold">Доставка и галерия</h1></div>
        <ArtStudioAdminNav />
      </header>
      {params.saved ? <p className="rounded-xl bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-100">Настройките са запазени.</p> : null}
      {params.error ? <p className="rounded-xl bg-red-500/10 p-4 text-sm font-semibold text-red-100">{params.error}</p> : null}
      <form action={saveArtStudioSettingsAction} className="grid gap-5 rounded-2xl bg-white p-6 text-stone-950">
        {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <input name="pickup_name_bg" defaultValue={settings.pickup_name_bg || ""} className={fieldClass} placeholder="Име на галерията BG" />
          <input name="pickup_name_en" defaultValue={settings.pickup_name_en || ""} className={fieldClass} placeholder="Gallery name EN" />
          <input name="pickup_address_bg" defaultValue={settings.pickup_address_bg || ""} className={fieldClass} placeholder="Адрес BG" />
          <input name="pickup_address_en" defaultValue={settings.pickup_address_en || ""} className={fieldClass} placeholder="Address EN" />
          <input name="pickup_phone" defaultValue={settings.pickup_phone || ""} className={fieldClass} placeholder="Телефон" />
          <div className="rounded-xl bg-stone-100 p-4 text-sm text-stone-700"><strong>Имейл за поръчки:</strong> {adminNotificationEmail || "ADMIN_NOTIFICATION_EMAIL не е настроен"}</div>
          <textarea name="pickup_instructions_bg" defaultValue={settings.pickup_instructions_bg || ""} rows={3} className={fieldClass} placeholder="Инструкции за взимане BG" />
          <textarea name="pickup_instructions_en" defaultValue={settings.pickup_instructions_en || ""} rows={3} className={fieldClass} placeholder="Pickup instructions EN" />
          <textarea name="econt_instructions_bg" defaultValue={settings.econt_instructions_bg || ""} rows={3} className={fieldClass} placeholder="Инструкции за Еконт BG" />
          <textarea name="econt_instructions_en" defaultValue={settings.econt_instructions_en || ""} rows={3} className={fieldClass} placeholder="Econt instructions EN" />
        </div>
        <label className="choice-row text-sm font-semibold"><input type="checkbox" name="orders_enabled" defaultChecked={settings.orders_enabled} className="choice-control" />Приемай нови поръчки</label>
        <button className="admin-button admin-button-forest w-fit px-5 py-3 text-sm font-semibold">Запази настройките</button>
      </form>
    </div>
  );
}
