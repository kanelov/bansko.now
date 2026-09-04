import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath } from "@/lib/i18n";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PhotoLicenseOrder } from "@/lib/types";

type Params = Promise<{ locale: string }>;
type Search = Promise<{ session_id?: string; order?: string }>;

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Shows the verified state of the order. Landing here is never treated as a successful payment:
 * the status comes from the database, which only the webhook may set to paid.
 */
export default async function PhotoLicenseSuccessPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const isEnglish = locale === "en";
  const settings = await getSiteSettings(locale);

  const supabase = createSupabaseAdminClient();
  let order: PhotoLicenseOrder | null = null;
  let photoTitle = "";
  if (supabase && (query.session_id || query.order)) {
    const lookup = supabase.from("photo_license_orders").select("*").limit(1);
    const { data } = query.session_id
      ? await lookup.eq("stripe_checkout_session_id", query.session_id).maybeSingle()
      : await lookup.eq("order_code", String(query.order)).maybeSingle();
    order = (data as PhotoLicenseOrder) ?? null;
    if (order) {
      const { data: photo } = await supabase.from("photos").select("title_bg,title_en,photo_code").eq("id", order.photo_id).maybeSingle();
      photoTitle = (isEnglish ? photo?.title_en || photo?.title_bg : photo?.title_bg) || photo?.photo_code || "";
    }
  }

  const paid = order?.status === "paid";

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={null} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        {!order ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h1 className="font-serif text-3xl font-semibold text-stone-950">{isEnglish ? "Order not found" : "Поръчката не е намерена"}</h1>
            <p className="mt-3 text-stone-650">{isEnglish ? "Open the link from your confirmation email." : "Отвори линка от имейла за потвърждение."}</p>
          </section>
        ) : paid ? (
          <section className="rounded-2xl border border-forest/20 bg-sage/40 p-6">
            <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Payment received" : "Плащането е получено"}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-stone-950">{isEnglish ? "Your license is ready" : "Лицензът ти е готов"}</h1>
            <dl className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "Order" : "Поръчка"}</dt><dd className="font-semibold">{order.order_code}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "Photograph" : "Фотография"}</dt><dd className="font-semibold">{photoTitle}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-600">{isEnglish ? "License" : "Лиценз"}</dt><dd className="font-semibold">{order.license_code}</dd></div>
            </dl>
            <a
              href={`/api/photo-license/download/${order.download_token}`}
              className="mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss"
            >
              {isEnglish ? "Download the photograph" : "Свали фотографията"}
            </a>
            <details className="mt-6 rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <summary className="cursor-pointer font-semibold text-stone-950">{isEnglish ? "License terms" : "Условия на лиценза"}</summary>
              <p className="mt-3 whitespace-pre-line leading-6 text-stone-650">{order.license_terms_snapshot}</p>
            </details>
            <p className="mt-4 text-xs text-stone-500">
              {isEnglish ? "The same link is in your email and keeps working." : "Същият линк е в имейла ти и продължава да работи."}
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-stone-200 bg-white p-6" aria-live="polite">
            <h1 className="font-serif text-3xl font-semibold text-stone-950">{isEnglish ? "Confirming the payment" : "Потвърждаваме плащането"}</h1>
            <p className="mt-3 text-stone-650">
              {isEnglish
                ? "This takes a few seconds. Refresh the page, or open the link from the confirmation email that arrives once the payment is confirmed."
                : "Отнема няколко секунди. Презареди страницата или отвори линка от имейла, който идва след потвърждението."}
            </p>
            <p className="mt-4 text-sm text-stone-500">{order.order_code}</p>
          </section>
        )}
        <p className="mt-8 text-sm">
          <Link href={localePath(locale, "/photos") as Route} className="font-semibold text-forest hover:underline">
            {isEnglish ? "Back to the photo library" : "Обратно към фотоархива"}
          </Link>
        </p>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
