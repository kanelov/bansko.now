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
    title: dictionary.terms,
    description: locale === "en" ? "Terms for Bansko NOW." : "Условия за ползване на Bansko NOW.",
    alternates: { canonical: localeUrl(locale, "/terms"), languages: { bg: localeUrl("bg", "/terms"), en: localeUrl("en", "/terms"), "x-default": localeUrl("bg", "/terms") } }
  };
}

export default async function TermsPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/terms")} />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-5xl font-semibold text-stone-950">{dictionary.terms}</h1>
        <p className="mt-6 text-lg leading-8 text-stone-650">
          {locale === "en" ? "Bansko NOW publishes editorial content about local life, events, nature, culture, services and products inspired by Bansko." : "Bansko NOW публикува редакционно съдържание за местния живот, събитията, природата, културата, услугите и продуктите, вдъхновени от Банско."}
        </p>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
