import type { Metadata } from "next";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "За проекта",
  description: "Bansko NOW е локална lifestyle и културна платформа за Банско, Пирин и живота в планинския град."
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-semibold uppercase text-moss">За проекта</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">Bansko NOW</h1>
          <p className="mt-6 text-xl leading-9 text-stone-650">
            Bansko NOW е местна дигитална платформа за събития, култура, природа, хора и ежедневен живот в Банско.
          </p>
        </header>
        <div className="grid gap-6 text-lg leading-8 text-stone-700">
          <p>
            Целта е проста: красиви, полезни и SEO оптимизирани статии, публикувани редовно, без шум, банери или усещане за стандартен блог.
          </p>
          <p>
            Разговорът с общността живее основно във Facebook групата, а сайтът служи като чист редакционен дом за съдържание, услуги и вдъхновени от Банско продукти.
          </p>
        </div>
        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
