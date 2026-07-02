import Link from "next/link";
import type { Metadata } from "next";
import { IllustratedBusinessMap } from "@/components/public/illustrated-business-map";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getApprovedBusinesses, getBusinessDirectorySettings } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Карта на бизнесите в Банско | Bansko NOW",
  description: "Илюстрирана карта с местни бизнеси, места и услуги в Банско."
};

export default async function BusinessMapPage() {
  const [siteSettings, directorySettings, businesses] = await Promise.all([
    getSiteSettings(),
    getBusinessDirectorySettings(),
    getApprovedBusinesses()
  ]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">Карта</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">Банско като илюстрация</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">
              Откривай бизнеси върху красива карта на града и отваряй упътване в Google Maps.
            </p>
          </div>
          <Link href="/businesses" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
            Към каталога
          </Link>
        </header>
        <IllustratedBusinessMap businesses={businesses} settings={directorySettings} />
      </main>
      <SiteFooter settings={siteSettings} />
    </div>
  );
}
