import type { Metadata } from "next";
import { saveBusinessProfileAction } from "@/app/business/profile/actions";
import { ProfilePhotosField } from "@/components/business/profile-photos-field";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Профил"
};

const errorMessages: Record<string, string> = {
  url: "Някой от линковете не е правилен. Пример: https://www.facebook.com/…",
  email: "Имейлът не е правилен.",
  phone: "Телефонът не е правилен. Пример: +359 88 123 4567",
  save: "Записът не успя. Опитай пак."
};

export default async function BusinessProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ saved, error }, { supabase, business }] = await Promise.all([searchParams, requireBusinessOwner()]);
  const [{ data: row }, { data: translations }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, slug, category, status, listing_tier, phone, email_public, website_url, facebook_url, instagram_url, images")
      .eq("id", business.businessId)
      .maybeSingle(),
    supabase.from("business_translations").select("locale, slug, description, address").eq("business_id", business.businessId)
  ]);

  const bg = translations?.find((item) => item.locale === "bg");
  const en = translations?.find((item) => item.locale === "en");
  const publicUrl = `${siteUrl}/places/${bg?.slug ?? row?.slug ?? ""}`;

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Профил</p>
        <h1 className={portalUi.h1}>Страницата на {business.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Това виждат гостите в каталога на Bansko NOW. Промените се показват до няколко минути.{" "}
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline underline-offset-4">
            Отвори страницата
          </a>
        </p>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          Профилът е записан.
        </div>
      ) : null}
      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
        </div>
      ) : null}

      <section className={portalUi.card + " grid gap-3"}>
        <h2 className={portalUi.h2}>Снимки</h2>
        <ProfilePhotosField initial={(row?.images ?? []).filter(Boolean)} />
      </section>

      <form action={saveBusinessProfileAction} className={portalUi.card + " grid gap-5"}>
        <input type="hidden" name="business_id" value={business.businessId} />
        <h2 className={portalUi.h2}>Текстове и контакти</h2>

        <label className={portalUi.label}>
          <span>Описание на български</span>
          <textarea name="description_bg" defaultValue={bg?.description ?? ""} maxLength={3000} rows={6} className={portalUi.textarea} />
        </label>
        <label className={portalUi.label}>
          <span>
            Описание на английски <span className={portalUi.hint}>за гостите от чужбина; без него страницата на английски не се показва</span>
          </span>
          <textarea name="description_en" defaultValue={en?.description ?? ""} maxLength={3000} rows={6} className={portalUi.textarea} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={portalUi.label}>
            <span>Адрес</span>
            <input name="address_bg" defaultValue={bg?.address ?? ""} maxLength={200} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>Адрес на английски</span>
            <input name="address_en" defaultValue={en?.address ?? ""} maxLength={200} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>Телефон</span>
            <input name="phone" type="tel" defaultValue={row?.phone ?? ""} maxLength={40} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>Имейл за гостите</span>
            <input name="email_public" type="email" defaultValue={row?.email_public ?? ""} maxLength={160} className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>Сайт</span>
            <input name="website_url" defaultValue={row?.website_url ?? ""} maxLength={300} placeholder="https://" className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>Facebook</span>
            <input name="facebook_url" defaultValue={row?.facebook_url ?? ""} maxLength={300} placeholder="https://www.facebook.com/…" className={portalUi.input} />
          </label>
          <label className={portalUi.label}>
            <span>Instagram</span>
            <input name="instagram_url" defaultValue={row?.instagram_url ?? ""} maxLength={300} placeholder="https://www.instagram.com/…" className={portalUi.input} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={portalUi.primaryButton}>
            Запази профила
          </button>
        </div>
      </form>

      <section className={portalUi.card + " grid gap-2 bg-paper"}>
        <h2 className={portalUi.h2}>Променя се от Bansko NOW</h2>
        <ul className="grid gap-1 text-sm text-stone-650">
          <li>
            Име и адрес на страницата: <strong className="text-stone-950">{row?.name}</strong> · <span className="font-mono text-xs">/places/{bg?.slug ?? row?.slug}</span>
          </li>
          <li>
            Категория: <strong className="text-stone-950">{row?.category}</strong>
          </li>
          <li>Премиум място в каталога, одобрение и специално оформената част на страницата.</li>
        </ul>
        <p className={portalUi.hint}>За промяна на тези пиши на Bansko NOW.</p>
      </section>
    </div>
  );
}
