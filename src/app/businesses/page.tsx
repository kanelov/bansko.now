import Link from "next/link";
import type { Metadata } from "next";
import { BusinessDirectoryView } from "@/components/public/business-directory-view";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getApprovedBusinesses, getBusinessDirectorySettings } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Местни бизнеси в Банско | Bansko NOW",
  description: "Каталог с местни бизнеси, услуги, места и партньори в Банско."
};

export default async function BusinessesPage() {
  const [siteSettings, directorySettings, businesses] = await Promise.all([
    getSiteSettings(),
    getBusinessDirectorySettings(),
    getApprovedBusinesses()
  ]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <header className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">Bansko NOW Local</p>
            <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold text-stone-950">
              {directorySettings.intro_title || "Местни бизнеси в Банско"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">
              {directorySettings.intro_description || "Открий места, услуги и локални партньори в Банско."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/businesses/map" className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss">
              Виж картата
            </Link>
            <Link href="/businesses/submit" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white">
              Добави бизнес
            </Link>
          </div>
        </header>
        <BusinessDirectoryView businesses={businesses} />
      </main>
      <SiteFooter settings={siteSettings} />
    </div>
  );
}
