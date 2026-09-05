import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { createPhotoLicenseCheckoutAction } from "@/app/(site)/[locale]/photos/actions";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { getPhotoArchiveCopy, getPhotoBySlug, getPhotoLicenseTypes, photoLicensePrice } from "@/lib/photos";
import type { Locale } from "@/lib/types";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<{ error?: string }>;

export const dynamic = "force-dynamic";

const fieldClass = "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

const errors: Record<string, { bg: string; en: string }> = {
  required: { bg: "Провери имейла, името и отметката за условията.", en: "Check the email, the name and the terms checkbox." },
  unavailable: { bg: "Тази фотография не се лицензира в момента.", en: "This photograph is not available for licensing right now." },
  payment: { bg: "Плащането не можа да започне. Опитай отново.", en: "The payment could not be started. Please try again." },
  cancelled: { bg: "Плащането беше прекратено.", en: "The payment was cancelled." },
  "save-failed": { bg: "Поръчката не можа да бъде записана.", en: "The order could not be saved." },
  "server-config": { bg: "Лицензирането е временно недостъпно.", en: "Licensing is temporarily unavailable." },
  invalid: { bg: "Заявката не беше приета.", en: "The request was not accepted." }
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const photo = await getPhotoBySlug(slug, locale);
  if (!photo) return {};
  return {
    title: { absolute: `${locale === "en" ? "License" : "Лиценз"}: ${photo.title} | Bansko NOW` },
    alternates: { canonical: localeUrl(locale, `/photos/${photo.slug}`) },
    robots: { index: false, follow: true }
  };
}

export default async function PhotoLicensePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const photo = await getPhotoBySlug(slug, locale);
  if (!photo || !photo.licensing_enabled) notFound();

  const isEnglish = locale === "en";
  const [licenses, settings, text] = await Promise.all([getPhotoLicenseTypes(), getSiteSettings(locale), getPhotoArchiveCopy(locale)]);
  const errorText = query.error ? errors[query.error]?.[locale as Locale] : null;
  const money = (value: number) =>
    new Intl.NumberFormat(isEnglish ? "en-GB" : "bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(isEnglish ? "bg" : "en", `/photos/${photo.slug}/license`)} />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <nav className="text-sm text-stone-500">
          <Link href={localePath(locale, "/photos") as Route}>{text.eyebrow}</Link>
          <span className="px-2">/</span>
          <Link href={localePath(locale, `/photos/${photo.slug}`) as Route}>{photo.title}</Link>
        </nav>

        <h1 className="mt-8 font-serif text-4xl font-semibold text-stone-950">{text.licensePageTitle}</h1>
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4">
          {photo.thumb_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- deliberate: files are served from the R2 CDN
            <img src={photo.thumb_url} alt={photo.alt} className="h-20 w-20 rounded-lg object-cover" />
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">{photo.photo_code}</p>
            <p className="font-serif text-2xl font-semibold text-stone-950">{photo.title}</p>
          </div>
        </div>

        {errorText ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{errorText}</p> : null}

        <form action={createPhotoLicenseCheckoutAction} className="mt-6 grid gap-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft sm:p-7">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={photo.slug} />
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <fieldset className="grid gap-3">
            <legend className="font-semibold text-stone-950">{text.chooseLicense}</legend>
            {licenses.map((license, index) => (
              <label key={license.id} className="grid cursor-pointer grid-cols-[1.25rem_1fr_auto] items-start gap-3 rounded-xl border border-stone-200 p-4 transition hover:border-moss">
                <input type="radio" name="license_code" value={license.code} defaultChecked={index === 0} required className="choice-control" />
                <span>
                  <strong className="block text-stone-950">{isEnglish ? license.name_en : license.name_bg}</strong>
                  <small className="mt-1 block leading-5 text-stone-600">{isEnglish ? license.summary_en : license.summary_bg}</small>
                </span>
                <strong className="text-forest">{money(photoLicensePrice(photo, license))}</strong>
              </label>
            ))}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">{isEnglish ? "Name" : "Име"}<input name="customer_name" required autoComplete="name" className={fieldClass} /></label>
            <label className="grid gap-2 text-sm font-semibold">Email<input name="customer_email" type="email" required autoComplete="email" className={fieldClass} /></label>
            <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{isEnglish ? "Company (optional)" : "Фирма (по желание)"}<input name="company_name" className={fieldClass} /></label>
          </div>

          <details className="rounded-xl border border-stone-200 p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-stone-950">{text.readTerms}</summary>
            <div className="mt-3 grid gap-5">
              {licenses.map((license) => (
                <div key={license.id}>
                  <p className="font-semibold text-stone-900">{isEnglish ? license.name_en : license.name_bg}</p>
                  <p className="mt-2 whitespace-pre-line leading-6 text-stone-650">{isEnglish ? license.terms_en : license.terms_bg}</p>
                </div>
              ))}
            </div>
          </details>

          <label className="choice-row text-sm leading-6 text-stone-650">
            <input type="checkbox" name="accept_terms" required className="choice-control" />
            <span>
              {text.acceptTerms}
            </span>
          </label>

          <button className="admin-button admin-button-forest w-full px-6 py-4 text-base font-semibold">
            {text.continueButton}
          </button>
          <p className="text-center text-xs leading-5 text-stone-500">
            {text.paymentNote}
          </p>
        </form>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
