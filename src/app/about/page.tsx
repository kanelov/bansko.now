import type { Metadata } from "next";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getBusinessDirectorySettings } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "За проекта",
  description: "Bansko NOW е локална lifestyle и културна платформа за Банско, Пирин и живота в планинския град."
};

export default async function AboutPage() {
  const [settings, aboutSettings] = await Promise.all([getSiteSettings(), getBusinessDirectorySettings()]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">{aboutSettings.about_eyebrow || "За проекта"}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{aboutSettings.about_title || "Bansko NOW"}</h1>
            <p className="mt-6 text-xl leading-9 text-stone-650">
              {aboutSettings.about_description ||
                "Bansko NOW е местна дигитална платформа за събития, култура, природа, хора и ежедневен живот в Банско."}
            </p>
          </div>
          {aboutSettings.about_image_url ? (
            <img src={aboutSettings.about_image_url} alt={aboutSettings.about_title || "Bansko NOW"} className="aspect-[4/3] rounded-3xl object-cover shadow-soft" />
          ) : null}
        </header>
        <div className="grid gap-6 text-lg leading-8 text-stone-700">
          {(aboutSettings.about_body || "")
            .split(/\n+/)
            .filter(Boolean)
            .map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>
        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
