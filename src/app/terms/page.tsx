import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for Bansko NOW."
};

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-5xl font-semibold text-stone-950">Terms</h1>
        <p className="mt-6 text-lg leading-8 text-stone-650">
          Bansko NOW publishes editorial content about local life, events, nature, culture, services, and products inspired by Bansko.
        </p>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
