import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;

export const metadata: Metadata = {
  title: "Art Studio order",
  robots: { index: false, follow: false }
};

export default async function ArtStudioOrderSuccessPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = await getSiteSettings(locale);
  const isEnglish = locale === "en";

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio/order/success")} />
      <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-28 sm:px-6">
        <section className="w-full rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-soft sm:p-12">
          <p className="text-sm font-semibold uppercase text-moss">Bansko NOW Art Studio</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold text-stone-950">{isEnglish ? "Thank you for your order" : "Благодарим за поръчката"}</h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-stone-650">
            {isEnglish ? "Stripe is confirming the payment. You will receive an email with the order details after successful payment." : "Stripe потвърждава плащането. След успешно плащане ще получиш имейл с данните за поръчката."}
          </p>
          <Link href={localePath(locale, "/art-studio")} className="admin-button admin-button-forest mt-8 px-6 py-3 text-sm font-semibold">
            {isEnglish ? "Back to Art Studio" : "Обратно към Art Studio"}
          </Link>
        </section>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
