import type { Metadata } from "next";
import { submitContactMessageAction } from "@/app/(site)/[locale]/businesses/actions";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getEditablePageBySlug, getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import { notFound } from "next/navigation";

type SearchParams = Promise<{ sent?: string; error?: string }>;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getEditablePageBySlug("contact", { locale });

  return {
    title: page?.seo_title || page?.title || "Контакт",
    description:
      page?.seo_description ||
      page?.excerpt ||
      "Свържи се с Bansko NOW за събития, препоръки, визуални проекти и локални истории.",
    alternates: {
      canonical: page?.canonical_url || localeUrl(locale, "/contact"),
      languages: { bg: localeUrl("bg", "/contact"), en: localeUrl("en", "/contact"), "x-default": localeUrl("bg", "/contact") }
    },
    openGraph: {
      title: page?.og_title || page?.seo_title || page?.title || "Контакт",
      description: page?.og_description || page?.seo_description || page?.excerpt || undefined,
      images: page?.og_image_url || page?.hero_image_url ? [page.og_image_url || page.hero_image_url || ""] : undefined
    },
    robots: {
      index: page?.robots_index ?? true,
      follow: page?.robots_follow ?? true
    }
  };
}

export default async function ContactPage({ searchParams, params }: { searchParams: SearchParams; params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const [query, settings, page] = await Promise.all([
    searchParams,
    getSiteSettings(locale),
    getEditablePageBySlug("contact", { locale })
  ]);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/contact")} />
      <main className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-semibold uppercase text-moss">{page?.eyebrow || dictionary.contact}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">
            {page?.title || "Пиши на Bansko NOW"}
          </h1>
          <p className="mt-6 text-xl leading-9 text-stone-650">
            {page?.excerpt ||
              (locale === "en" ? "For events, photos, recommendations, Art Studio services or Bansko Collection ideas." : "За събития, снимки, препоръки, Art Studio услуги или Bansko Collection идеи.")}
          </p>
        </header>

        {query.sent ? (
          <div className="rounded-3xl border border-sage bg-white p-6 shadow-soft">
            <p className="font-semibold text-forest">{locale === "en" ? "Your message has been sent. Thank you!" : "Съобщението е изпратено. Благодарим!"}</p>
          </div>
        ) : null}

        {query.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
            {locale === "en" ? "An error occurred" : "Възникна проблем"}: {query.error}
          </div>
        ) : null}

        <form action={submitContactMessageAction} className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              {locale === "en" ? "Name" : "Име"}
              <input name="name" required className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              {dictionary.email}
              <input name="email" type="email" required className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              {locale === "en" ? "Phone" : "Телефон"}
              <input name="phone" className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              {locale === "en" ? "Subject" : "Тема"}
              <input name="subject" className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            {locale === "en" ? "Message" : "Съобщение"}
            <textarea name="message" required rows={6} className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <button className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
            {locale === "en" ? "Send" : "Изпрати"}
          </button>
        </form>

        <FacebookGroupCTA settings={settings} locale={locale} />
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
