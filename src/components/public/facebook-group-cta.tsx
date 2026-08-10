import type { SiteSettings } from "@/lib/types";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function FacebookGroupCTA({ settings, locale = "bg" }: { settings: SiteSettings; locale?: Locale }) {
  if (!settings.facebook_group_url) {
    return null;
  }

  const dictionary = getDictionary(locale);

  return (
    <section id="community" className="rounded-3xl bg-forest p-8 text-white sm:p-10">
      <div className="grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">{settings.facebook_cta_eyebrow || dictionary.facebookCtaEyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">{settings.facebook_cta_title || dictionary.facebookCtaTitle}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-100">
            {settings.facebook_cta_text || dictionary.facebookCtaText}
          </p>
        </div>
        <a
          href={settings.facebook_group_url}
          className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {settings.facebook_cta_button_label || dictionary.facebookCtaButton}
        </a>
      </div>
    </section>
  );
}
