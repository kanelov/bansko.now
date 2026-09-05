import { deletePhotoAction, updatePhotoAction } from "@/app/admin/photo-actions";
import { PhotoAdminNav } from "@/components/admin/photo-admin-nav";
import { PhotoCsvTools } from "@/components/admin/photo-csv-tools";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { getPublicPhotoUrl, photoPublicUrlConfigured, photoStorageConfigured } from "@/lib/photo-storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Photo } from "@/lib/types";

type SearchParams = Promise<{ saved?: string; deleted?: string; error?: string; q?: string }>;

const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950";
const labelClass = "grid gap-1 text-xs font-semibold text-stone-700";

export default async function AdminPhotosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(200)
    : { data: [] };
  const photos = (data ?? []) as Photo[];
  const published = photos.filter((photo) => photo.is_published).length;
  // Recent license sales, so the download link can be handed over if an email does not arrive.
  const { data: licenseOrders } = supabase
    ? await supabase
        .from("photo_license_orders")
        .select("order_code,license_code,amount,currency,status,customer_email,customer_name,created_at,paid_at,download_token,download_count,photo_id")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };
  const { data: failedJobs } = supabase
    ? await supabase
        .from("photo_import_jobs")
        .select("source_filename,error_message,processed_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };
  // Current license prices, so the price tier labels below never go stale.
  const { data: licenseTypes } = supabase
    ? await supabase.from("photo_license_types").select("code,price_standard_eur,price_premium_eur").eq("is_active", true).order("sort_order", { ascending: true })
    : { data: [] };
  const tierLabel = (tier: "standard" | "premium") => {
    const prices = (licenseTypes ?? []).map((row) => Number(tier === "standard" ? row.price_standard_eur : row.price_premium_eur).toFixed(0));
    return prices.length ? ` (${prices.join(" / ")} EUR)` : "";
  };

  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Фотоархив</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Фотографии</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
            {photos.length} във архива, {published} публикувани. Публикуваните се виждат на /photos и могат да се прикачат към статии.
            Текстовете на страниците, името на фотографа и условията и цените на лицензите са в „Текстове и лицензи“.
          </p>
        </div>
        <PhotoAdminNav />
      </header>

      {!photoStorageConfigured() ? (
        <p className="rounded-xl border border-amber-300 bg-amber-100 p-4 text-sm text-amber-900">
          Липсват настройките за R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME). Качването няма да работи.
        </p>
      ) : null}
      {!photoPublicUrlConfigured() ? (
        <p className="rounded-xl border border-amber-300 bg-amber-100 p-4 text-sm text-amber-900">
          Липсва PHOTO_PUBLIC_BASE_URL, затова снимките няма да се показват публично.
        </p>
      ) : null}
      {params.saved ? <p className="rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-sm font-semibold text-emerald-900">Записано.</p> : null}
      {params.deleted ? <p className="rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-sm font-semibold text-emerald-900">Фотографията е изтрита.</p> : null}
      {params.error ? <p className="rounded-xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">{params.error}</p> : null}

      {failedJobs?.length ? (
        <section className="rounded-2xl border border-red-300 bg-red-100 p-4 text-sm text-red-900">
          <p className="font-semibold">Последни неуспешни качвания</p>
          <ul className="mt-2 grid gap-1">
            {failedJobs.map((job) => (
              <li key={`${job.source_filename}-${job.processed_at}`}>
                <strong>{job.source_filename || "файл"}</strong>: {job.error_message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PhotoUploader />

      {photos.length ? <PhotoCsvTools /> : null}

      {licenseOrders?.length ? (
        <section className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Продажби на лицензи</h2>
            <p className="mt-1 text-sm text-stone-600">
              Линкът за сваляне работи само при платена поръчка и всеки път създава нов временен адрес. Ако имейлът до клиента не пристигне, изпрати му този линк.
            </p>
          </div>
          <ul className="grid gap-2 text-sm">
            {licenseOrders.map((order) => {
              const photo = photos.find((item) => item.id === order.photo_id);
              return (
                <li key={order.order_code} className="grid gap-1 rounded-xl border border-stone-200 p-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-3">
                  <span>
                    <strong className="block">{order.order_code}</strong>
                    <span className="text-xs text-stone-500">{new Date(order.created_at).toLocaleString("bg-BG")}</span>
                  </span>
                  <span>
                    <span className="block">{photo?.title_bg || photo?.photo_code || "фотография"} · {order.license_code === "PRINT_EXTENDED" ? "печатен лиценз" : "уеб лиценз"}</span>
                    <span className="text-xs text-stone-500">{order.customer_name} · {order.customer_email}</span>
                  </span>
                  <span className="flex items-center gap-3 justify-self-start sm:justify-self-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "paid" ? "bg-forest text-white" : "bg-stone-200 text-stone-700"}`}>
                      {order.status === "paid" ? "платена" : order.status === "pending" ? "чака плащане" : order.status}
                    </span>
                    <strong>{Number(order.amount).toFixed(0)} {order.currency}</strong>
                    {order.status === "paid" ? (
                      <a
                        href={`/api/photo-license/download/${order.download_token}`}
                        className="text-xs font-semibold text-forest underline-offset-2 hover:underline"
                      >
                        линк за сваляне ({order.download_count})
                      </a>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4">
        {photos.map((photo) => {
          const thumb = getPublicPhotoUrl(photo.thumb_key);
          return (
            <details key={photo.id} className="rounded-2xl bg-white p-4 text-stone-950">
              <summary className="cursor-pointer list-none">
                <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-4">
                  <span className="block h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- deliberate: files are served from the R2 CDN
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase text-stone-500">{photo.photo_code}</span>
                    <span className="block font-serif text-xl font-semibold">{photo.title_bg}</span>
                    <span className="block text-xs text-stone-500">
                      {[photo.location_name, photo.category, photo.year_taken ? String(photo.year_taken) : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${photo.is_published ? "bg-forest text-white" : "bg-stone-200 text-stone-700"}`}>
                    {photo.is_published ? "публикувана" : "чернова"}
                  </span>
                </div>
              </summary>

              <form action={updatePhotoAction} className="mt-4 grid gap-3 border-t border-stone-200 pt-4">
                <input type="hidden" name="id" value={photo.id} />
                <input type="hidden" name="published_at" value={photo.published_at ?? ""} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Заглавие BG<input name="title_bg" defaultValue={photo.title_bg} required className={fieldClass} /></label>
                  <label className={labelClass}>Title EN<input name="title_en" defaultValue={photo.title_en ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>Описание BG<textarea name="description_bg" defaultValue={photo.description_bg ?? ""} rows={3} className={fieldClass} /></label>
                  <label className={labelClass}>Description EN<textarea name="description_en" defaultValue={photo.description_en ?? ""} rows={3} className={fieldClass} /></label>
                  <label className={labelClass}>Alt текст BG<input name="alt_bg" defaultValue={photo.alt_bg ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>Alt text EN<input name="alt_en" defaultValue={photo.alt_en ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>Надпис BG<input name="caption_bg" defaultValue={photo.caption_bg ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>Caption EN<input name="caption_en" defaultValue={photo.caption_en ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>Място<input name="location_name" defaultValue={photo.location_name ?? ""} className={fieldClass} placeholder="Вихрен" /></label>
                  <label className={labelClass}>Категория<input name="category" defaultValue={photo.category ?? ""} className={fieldClass} placeholder="Пирин" /></label>
                  <label className={labelClass}>Тагове (със запетая)<input name="tags" defaultValue={(photo.tags ?? []).join(", ")} className={fieldClass} /></label>
                  <label className={labelClass}>Адрес (slug)<input name="slug" defaultValue={photo.slug} className={fieldClass} /></label>
                  <label className={labelClass}>Дата на заснемане<input name="date_taken" type="date" defaultValue={photo.date_taken ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>Година<input name="year_taken" type="number" defaultValue={photo.year_taken ?? ""} className={fieldClass} /></label>
                  <label className={labelClass}>
                    Сезон
                    <select name="season" defaultValue={photo.season ?? ""} className={fieldClass}>
                      <option value="">—</option>
                      <option value="winter">Зима</option>
                      <option value="spring">Пролет</option>
                      <option value="summer">Лято</option>
                      <option value="autumn">Есен</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Ниво на цената
                    <select name="price_tier" defaultValue={photo.price_tier} className={fieldClass}>
                      <option value="standard">Репортажна{tierLabel("standard")}</option>
                      <option value="premium">Пейзажна{tierLabel("premium")}</option>
                    </select>
                  </label>
                  <label className={labelClass}>Собствена цена уеб (EUR)<input name="price_override_web" defaultValue={photo.price_override_web ?? ""} className={fieldClass} placeholder="празно = по нивото" /></label>
                  <label className={labelClass}>Собствена цена печат (EUR)<input name="price_override_print" defaultValue={photo.price_override_print ?? ""} className={fieldClass} placeholder="празно = по нивото" /></label>
                  <label className={labelClass}>
                    Pixsy статус
                    <select name="monitoring_status" defaultValue={photo.monitoring_status} className={fieldClass}>
                      <option value="not_submitted">Неизпратена</option>
                      <option value="submitted">Изпратена</option>
                      <option value="monitoring">Следи се</option>
                      <option value="disabled">Изключена</option>
                    </select>
                  </label>
                  <label className={labelClass}>Pixsy референция<input name="monitoring_reference" defaultValue={photo.monitoring_reference ?? ""} className={fieldClass} /></label>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="choice-row text-sm"><input type="checkbox" name="is_published" defaultChecked={photo.is_published} className="choice-control" />Публикувана</label>
                  <label className="choice-row text-sm"><input type="checkbox" name="is_featured" defaultChecked={photo.is_featured} className="choice-control" />Избрана</label>
                  <label className="choice-row text-sm"><input type="checkbox" name="licensing_enabled" defaultChecked={photo.licensing_enabled} className="choice-control" />Може да се лицензира</label>
                  <label className="choice-row text-sm"><input type="checkbox" name="print_enabled" defaultChecked={photo.print_enabled} className="choice-control" />Може да се поръча като принт</label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="admin-button admin-button-forest px-4 py-2 text-sm font-semibold">Запази</button>
                  <span className="text-xs text-stone-500">{photo.width} × {photo.height} px</span>
                </div>
              </form>

              <form action={deletePhotoAction} className="mt-3 border-t border-stone-200 pt-3">
                <input type="hidden" name="id" value={photo.id} />
                <button className="admin-button admin-button-danger px-4 py-2 text-xs font-semibold">Изтрий фотографията</button>
              </form>
            </details>
          );
        })}
        {!photos.length ? (
          <p className="rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6 text-sm text-[var(--admin-muted)]">
            Още няма фотографии. Качи първите отгоре.
          </p>
        ) : null}
      </div>
    </div>
  );
}
