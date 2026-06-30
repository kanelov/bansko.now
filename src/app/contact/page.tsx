import type { Metadata } from "next";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Контакт",
  description: "Свържи се с Bansko NOW за събития, препоръки, визуални проекти и локални истории."
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-semibold uppercase text-moss">Контакт</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">Пиши на Bansko NOW</h1>
          <p className="mt-6 text-xl leading-9 text-stone-650">
            За събития, снимки, препоръки, Art Studio услуги или Bansko Collection идеи, най-бързият път е през общността.
          </p>
        </header>
        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
