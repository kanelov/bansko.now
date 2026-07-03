import type { Metadata } from "next";
import { BusinessSubmitForm } from "@/components/public/business-submit-form";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getBusinessDirectorySettings, getBusinessListingPlans } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";

type SearchParams = Promise<{ submitted?: string; error?: string }>;

export const metadata: Metadata = {
  title: "Добави бизнес | Bansko NOW",
  description: "Изпрати местен бизнес за включване в Bansko NOW Business Directory."
};

export default async function SubmitBusinessPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, siteSettings, directorySettings, plans] = await Promise.all([
    searchParams,
    getSiteSettings(),
    getBusinessDirectorySettings(),
    getBusinessListingPlans()
  ]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mx-auto w-full max-w-4xl text-center sm:text-left">
          <p className="text-sm font-semibold uppercase text-moss">Добави бизнес</p>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold text-stone-950">
            Представи местен бизнес в Bansko NOW
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-650">
            Попълни информацията и ще я прегледаме преди публикуване. Платените нива се активират ръчно след потвърдено плащане.
          </p>
        </header>

        {params.submitted ? (
          <div className="rounded-3xl border border-sage bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase text-moss">Получено</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">Благодарим за заявката.</h2>
            <p className="mt-3 text-stone-650">Ще я прегледаме и ще се свържем с теб при нужда.</p>
          </div>
        ) : null}

        {params.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
            Възникна проблем: {params.error}
          </div>
        ) : null}

        <BusinessSubmitForm plans={plans} settings={directorySettings} />
      </main>
      <SiteFooter settings={siteSettings} />
    </div>
  );
}
