import type { Metadata } from "next";
import { BusinessSubmitForm } from "@/components/public/business-submit-form";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getBusinessDirectorySettings, getBusinessListingPlans } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";

type SearchParams = Promise<{ submitted?: string; error?: string }>;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const path = "/businesses/submit";
  return {
    title: { absolute: locale === "en" ? "List your business | Bansko NOW" : "Добави бизнес | Bansko NOW" },
    description: locale === "en" ? "Submit a local business for inclusion in the Bansko NOW directory." : "Изпрати местен бизнес за включване в Bansko NOW Business Directory.",
    alternates: { canonical: localeUrl(locale, path), languages: { bg: localeUrl("bg", path), en: localeUrl("en", path), "x-default": localeUrl("bg", path) } },
    robots: { index: true, follow: true }
  };
}

export default async function SubmitBusinessPage({ searchParams, params }: { searchParams: SearchParams; params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [query, siteSettings, directorySettings, plans] = await Promise.all([
    searchParams,
    getSiteSettings(locale),
    getBusinessDirectorySettings(locale),
    getBusinessListingPlans()
  ]);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/businesses/submit")} />
      <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mx-auto w-full max-w-4xl text-center sm:text-left">
          <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "List a business" : "Добави бизнес"}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
            {locale === "en" ? "Present a local business in Bansko NOW" : "Представи местен бизнес в Bansko NOW"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">
            {locale === "en" ? "Complete the information and we will review it before publication. Paid tiers are activated manually after payment is confirmed." : "Попълни информацията и ще я прегледаме преди публикуване. Платените нива се активират ръчно след потвърдено плащане."}
          </p>
        </header>

        {query.submitted ? (
          <div className="rounded-3xl border border-sage bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase text-moss">{locale === "en" ? "Received" : "Получено"}</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{locale === "en" ? "Thank you for your submission." : "Благодарим за заявката."}</h2>
            <p className="mt-3 text-stone-650">{locale === "en" ? "We will review it and contact you if needed." : "Ще я прегледаме и ще се свържем с теб при нужда."}</p>
          </div>
        ) : null}

        {query.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
            {locale === "en" ? "An error occurred" : "Възникна проблем"}: {query.error}
          </div>
        ) : null}

        <BusinessSubmitForm plans={plans} settings={directorySettings} locale={locale} />
      </main>
      <SiteFooter settings={siteSettings} locale={locale} />
    </div>
  );
}
