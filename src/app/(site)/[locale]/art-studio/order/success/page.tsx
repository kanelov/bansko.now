import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ type?: string; ref?: string; status?: string; code?: string; back?: string }>;

export const metadata: Metadata = {
  title: "Art Studio order",
  robots: { index: false, follow: false }
};

const errorMessages: Record<string, { bg: string; en: string }> = {
  required: { bg: "Липсват задължителни полета. Провери името, имейла, телефона и отметката за условията.", en: "Required fields are missing. Check the name, email, phone and the terms checkbox." },
  delivery: { bg: "За доставка с Еконт са нужни град и офис.", en: "Econt delivery needs a city and an office." },
  options: { bg: "Избери всички задължителни опции на продукта.", en: "Choose all required product options." },
  attachment: { bg: "Файлът не можа да бъде приет. Разрешени са JPG, PNG, WebP, HEIC и PDF до 15 MB.", en: "The file could not be accepted. JPG, PNG, WebP, HEIC and PDF up to 15 MB are allowed." },
  unavailable: { bg: "Този продукт в момента не приема поръчки.", en: "This product is not accepting orders right now." },
  "save-failed": { bg: "Поръчката не можа да бъде записана. Опитай отново или ни пиши.", en: "The order could not be saved. Try again or contact us." },
  "server-config": { bg: "Поръчките са временно недостъпни. Свържи се с нас директно.", en: "Ordering is temporarily unavailable. Please contact us directly." },
  invalid: { bg: "Заявката не беше приета.", en: "The request was not accepted." }
};

export default async function ArtStudioOrderSuccessPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const settings = await getSiteSettings(locale);
  const isEnglish = locale === "en";
  const backPath = query.back && /^\/(en\/)?art-studio(\/|$)/.test(query.back) ? query.back : localePath(locale, "/art-studio");
  const isError = query.status === "error";
  const isEnquiry = query.type === "enquiry";
  const errorText = errorMessages[query.code || ""]?.[locale];

  let title: string;
  let text: string;
  if (isError) {
    title = isEnglish ? "Something went wrong" : "Нещо не се получи";
    text = errorText || (isEnglish ? "The order could not be sent. Please try again." : "Поръчката не можа да бъде изпратена. Опитай отново.");
  } else if (isEnquiry) {
    title = isEnglish ? "Thank you, we received your order" : "Благодарим, получихме поръчката ти";
    text = isEnglish
      ? "We sent you a confirmation email and will contact you by phone or email to agree the price, timing and pickup or delivery. No payment is due before that."
      : "Изпратихме ти потвърждение по имейл и ще се свържем с теб по телефон или имейл, за да уточним цената, срока и получаването. Плащане няма преди това.";
  } else {
    title = isEnglish ? "Thank you for your order" : "Благодарим за поръчката";
    text = isEnglish
      ? "Stripe is confirming the payment. You will receive an email with the order details after successful payment."
      : "Stripe потвърждава плащането. След успешно плащане ще получиш имейл с данните за поръчката.";
  }

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio/order/success")} />
      <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-28 sm:px-6">
        <section className="w-full rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-soft sm:p-12">
          <p className="text-sm font-semibold uppercase text-moss">Art Studio Bansko</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold text-stone-950">{title}</h1>
          {query.ref && !isError ? (
            <p className="mt-4 inline-flex rounded-full bg-sage px-4 py-2 text-sm font-semibold text-forest">
              {isEnglish ? "Order number" : "Номер на поръчката"}: {query.ref}
            </p>
          ) : null}
          <p className="mx-auto mt-5 max-w-xl leading-7 text-stone-650">{text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={backPath as Route} className="admin-button admin-button-forest px-6 py-3 text-sm font-semibold">
              {isError ? (isEnglish ? "Back to the form" : "Назад към формата") : isEnglish ? "Back to Art Studio" : "Обратно към Art Studio"}
            </Link>
            {isError ? (
              <Link href={localePath(locale, "/contact") as Route} className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
                {isEnglish ? "Contact us" : "Пиши ни"}
              </Link>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
