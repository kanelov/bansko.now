import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtStudioNativeBlock } from "@/components/public/art-studio-native-block";
import { BanskoCollectionBlock } from "@/components/public/bansko-collection-block";
import { BusinessSpotlightBlock } from "@/components/public/business-spotlight-block";
import { CategoryCard } from "@/components/public/category-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { FeaturedArticle } from "@/components/public/featured-article";
import { LatestArticles } from "@/components/public/latest-articles";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { WeatherWidget } from "@/components/public/weather-widget";
import { getBusinessVideoEmbedUrl } from "@/lib/business-public";
import { fallbackHeroImage, getCategories, getPublishedArticles, getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import type { Category, Locale, SiteSettings } from "@/lib/types";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;

// The home page is cached and refreshed every 15 minutes; publishing revalidates it immediately.
export const revalidate = 900;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSiteSettings(locale);

  return {
    description: settings.site_description || undefined,
    alternates: {
      canonical: localeUrl(locale),
      languages: { bg: localeUrl("bg"), en: localeUrl("en"), "x-default": localeUrl("bg") }
    },
    openGraph: {
      url: localeUrl(locale),
      images: settings.default_og_image || settings.hero_image_url ? [settings.default_og_image || settings.hero_image_url || ""] : undefined
    }
  };
}

function HeroMedia({ settings, locale }: { settings: SiteSettings; locale: Locale }) {
  const imageUrl = settings.hero_image_url || settings.default_og_image || fallbackHeroImage;
  const imageAlt = settings.hero_image_alt || (locale === "en" ? "Bansko and Pirin Mountain" : "Банско и Пирин");
  const hostedVideoEmbedUrl = getBusinessVideoEmbedUrl(settings.hero_video_url, { autoplay: true });
  const embedUrl = getBusinessVideoEmbedUrl(settings.hero_embed_url, { autoplay: true }) || settings.hero_embed_url;

  if (settings.hero_media_type === "video" && settings.hero_video_url) {
    if (hostedVideoEmbedUrl) {
      return (
        <iframe
          src={hostedVideoEmbedUrl}
          title="Bansko NOW hero video"
          className="hero-media-frame pointer-events-none border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={settings.hero_video_url}
        poster={settings.hero_video_poster_url || imageUrl}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  if (settings.hero_media_type === "embed" && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title="Bansko NOW hero video"
        className="hero-media-frame pointer-events-none border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
    <img
      src={imageUrl}
      alt={imageAlt}
      width={1920}
      height={1080}
      fetchPriority="high"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function quickLinks(locale: Locale, categories: Category[]) {
  const dictionary = getDictionary(locale);
  const links = categories.map((category) => ({
    id: category.id,
    title: category.name,
    text: category.description || "",
    href: `/${category.slug}`
  }));

  links.push({
    id: "articles",
    title: dictionary.allArticles,
    text: locale === "en" ? "Everything published on Bansko NOW, newest first." : "Всичко публикувано в Bansko NOW, най-новото първо.",
    href: "/articles"
  });
  links.push({
    id: "gallery",
    title: locale === "en" ? "Gallery" : "Галерия",
    text: locale === "en" ? "Original T-shirts, prints and mugs from the gallery in Bansko." : "Авторски тениски, принтове и чаши от галерията в Банско.",
    href: "/art-studio/gallery"
  });
  links.push({
    id: "businesses",
    title: dictionary.localBusinesses,
    text: dictionary.businessesIntro,
    href: "/businesses"
  });

  return links.slice(0, 4);
}

export default async function HomePage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const [settings, articles, featured, categories] = await Promise.all([
    getSiteSettings(locale),
    getPublishedArticles({ limit: 6, locale }),
    getPublishedArticles({ featured: true, limit: 1, locale }),
    getCategories(locale)
  ]);

  const featuredArticle = featured[0] ?? articles[0] ?? null;
  const latest = featuredArticle ? articles.filter((article) => article.id !== featuredArticle.id) : articles;
  const cards = quickLinks(locale, categories);
  const primaryCategory = categories[0] ?? null;
  const siteName = settings.site_name || "Bansko NOW";
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: `${siteUrl}/`,
    logo: settings.logo_image_url || undefined,
    sameAs: [settings.facebook_group_url, settings.instagram_url, settings.youtube_url].filter(Boolean)
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: localeUrl(locale),
    name: siteName,
    description: settings.site_description || dictionary.heroText,
    inLanguage: locale === "en" ? "en" : "bg",
    publisher: { "@id": `${siteUrl}/#organization` }
  };

  return (
    <div>
      <SiteHeader locale={locale} />
      <main>
        <section className="relative min-h-[100svh] overflow-hidden">
          <HeroMedia settings={settings} locale={locale} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/55" />
          <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase">{siteName}</p>
            <h1 className="mt-4 max-w-4xl font-serif text-6xl font-semibold leading-none sm:text-7xl">
              {dictionary.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100">
              {settings.site_description || dictionary.heroText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={localePath(locale, primaryCategory ? `/${primaryCategory.slug}` : "/articles") as Route}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100"
              >
                {primaryCategory ? primaryCategory.name : dictionary.heroToday}
              </Link>
              <Link
                href={localePath(locale, "/articles") as Route}
                className="rounded-full border border-white/70 bg-black/30 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/45"
              >
                {dictionary.heroLatest}
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-16 sm:px-6 lg:px-8">
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <WeatherWidget locale={locale} />
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <Link key={card.id} href={localePath(locale, card.href) as Route} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl">
                  <p className="text-xs font-semibold uppercase text-moss">{dictionary.todayInBansko}</p>
                  <h2 className="mt-3 font-serif text-2xl font-semibold text-stone-950">{card.title}</h2>
                  {card.text ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{card.text}</p> : null}
                </Link>
              ))}
            </div>
          </section>

          <FeaturedArticle article={featuredArticle} locale={locale} />

          <BusinessSpotlightBlock locale={locale} />

          {latest.length ? <LatestArticles articles={latest} locale={locale} /> : null}

          {categories.length >= 2 ? (
            <section>
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase text-moss">{dictionary.discoverBansko}</p>
                <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">{dictionary.placesRoutesSeasons}</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {categories.slice(0, 4).map((category) => (
                  <CategoryCard key={category.slug} category={category} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          <ArtStudioNativeBlock locale={locale} settings={settings} />
          <BanskoCollectionBlock locale={locale} settings={settings} />
          <FacebookGroupCTA settings={settings} locale={locale} />

          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-soft sm:p-10">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">Newsletter</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-950">
                  {dictionary.newsletterTitle}
                </h2>
              </div>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder={dictionary.email}
                  className="min-w-0 flex-1 rounded-full border border-stone-300 bg-paper px-5 py-3 text-sm"
                  disabled
                />
                <button type="button" className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white">
                  {dictionary.soon}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </div>
  );
}
