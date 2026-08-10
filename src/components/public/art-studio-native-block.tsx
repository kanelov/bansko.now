import Link from "next/link";
import { ArtStudioServiceCard } from "@/components/public/art-studio-service-card";
import { getArtStudioServices, getSiteSettings } from "@/lib/content";
import { getDictionary, localePath } from "@/lib/i18n";
import type { Locale, SiteSettings } from "@/lib/types";
import type { Route } from "next";

export async function ArtStudioNativeBlock({ locale = "bg", settings }: { locale?: Locale; settings?: SiteSettings }) {
  const [services, resolvedSettings] = await Promise.all([
    getArtStudioServices({ locale }),
    settings ? Promise.resolve(settings) : getSiteSettings(locale)
  ]);
  const dictionary = getDictionary(locale);
  const premium = services.find((service) => service.is_premium) ?? services[0] ?? null;
  const secondaryServices = services.filter((service) => service.id !== premium?.id).slice(0, 2);

  return (
    <section className="rounded-3xl border border-stone-200 bg-[#f7f2e8] p-6 shadow-soft sm:p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">{resolvedSettings.art_studio_block_eyebrow || dictionary.artStudioEyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">{resolvedSettings.art_studio_block_title || dictionary.artStudioTitle}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-650">
            {resolvedSettings.art_studio_block_text || dictionary.artStudioText}
          </p>
        </div>
        <Link
          href={localePath(locale, "/art-studio") as Route}
          className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-moss hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
        >
          {resolvedSettings.art_studio_block_button_label || dictionary.artStudioButton}
        </Link>
      </div>
      {premium ? <ArtStudioServiceCard service={premium} featured locale={locale} /> : null}
      {secondaryServices.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {secondaryServices.map((service) => (
            <ArtStudioServiceCard key={service.id} service={service} locale={locale} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
