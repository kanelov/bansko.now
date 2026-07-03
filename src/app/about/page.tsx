import type { Metadata } from "next";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getEditablePageBySlug, getSiteSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditablePageBySlug("about");

  return {
    title: page?.seo_title || page?.title || "За проекта",
    description:
      page?.seo_description ||
      page?.excerpt ||
      "Bansko NOW е локална lifestyle и културна платформа за Банско, Пирин и живота в планинския град.",
    alternates: { canonical: page?.canonical_url || "/about" },
    openGraph: {
      title: page?.og_title || page?.seo_title || page?.title || "За проекта",
      description: page?.og_description || page?.seo_description || page?.excerpt || undefined,
      images: page?.og_image_url || page?.hero_image_url ? [page.og_image_url || page.hero_image_url || ""] : undefined
    },
    robots: {
      index: page?.robots_index ?? true,
      follow: page?.robots_follow ?? true
    }
  };
}

export default async function AboutPage() {
  const [settings, page] = await Promise.all([getSiteSettings(), getEditablePageBySlug("about")]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">{page?.eyebrow || "За проекта"}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{page?.title || "Bansko NOW"}</h1>
            <p className="mt-6 text-xl leading-9 text-stone-650">
              {page?.excerpt ||
                "Bansko NOW е местна дигитална платформа за събития, култура, природа, хора и ежедневен живот в Банско."}
            </p>
          </div>
          {page?.hero_image_url ? (
            <img src={page.hero_image_url} alt={page.hero_image_alt || page.title} className="aspect-[4/3] rounded-3xl object-cover shadow-soft" />
          ) : null}
        </header>
        {page?.content ? <MarkdownRenderer content={page.content} /> : null}
        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
