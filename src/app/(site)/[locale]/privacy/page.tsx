import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  return {
    title: dictionary.privacy,
    description: locale === "en" ? "Privacy information for Bansko NOW." : "Информация за поверителността в Bansko NOW.",
    alternates: { canonical: localeUrl(locale, "/privacy"), languages: { bg: localeUrl("bg", "/privacy"), en: localeUrl("en", "/privacy"), "x-default": localeUrl("bg", "/privacy") } }
  };
}

export default async function PrivacyPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/privacy")} />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-5xl font-semibold text-stone-950">{dictionary.privacy}</h1>
        <p className="mt-6 text-lg leading-8 text-stone-650">
          {locale === "en" ? "Bansko NOW does not offer public accounts or comments. Administrative access is protected with Supabase Auth." : "Bansko NOW не предлага публични профили или коментари. Административният достъп е защитен чрез Supabase Auth."}
        </p>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
