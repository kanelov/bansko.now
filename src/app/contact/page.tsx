import type { Metadata } from "next";
import { submitContactMessageAction } from "@/app/businesses/actions";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getEditablePageBySlug, getSiteSettings } from "@/lib/content";

type SearchParams = Promise<{ sent?: string; error?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditablePageBySlug("contact");

  return {
    title: page?.seo_title || page?.title || "Контакт",
    description:
      page?.seo_description ||
      page?.excerpt ||
      "Свържи се с Bansko NOW за събития, препоръки, визуални проекти и локални истории.",
    alternates: { canonical: page?.canonical_url || "/contact" },
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

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, settings, page] = await Promise.all([
    searchParams,
    getSiteSettings(),
    getEditablePageBySlug("contact")
  ]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-semibold uppercase text-moss">{page?.eyebrow || "Контакт"}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">
            {page?.title || "Пиши на Bansko NOW"}
          </h1>
          <p className="mt-6 text-xl leading-9 text-stone-650">
            {page?.excerpt ||
              "За събития, снимки, препоръки, Art Studio услуги или Bansko Collection идеи."}
          </p>
        </header>

        {params.sent ? (
          <div className="rounded-3xl border border-sage bg-white p-6 shadow-soft">
            <p className="font-semibold text-forest">Съобщението е изпратено. Благодарим!</p>
          </div>
        ) : null}

        {params.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
            Възникна проблем: {params.error}
          </div>
        ) : null}

        <form action={submitContactMessageAction} className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Име
              <input name="name" required className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Имейл
              <input name="email" type="email" required className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Телефон
              <input name="phone" className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Тема
              <input name="subject" className="rounded-xl border border-stone-300 px-4 py-3" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Съобщение
            <textarea name="message" required rows={6} className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <button className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss">
            Изпрати
          </button>
        </form>

        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
