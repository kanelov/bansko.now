import Link from "next/link";
import type { Route } from "next";
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
import {
  categoryDefinitions,
  fallbackHeroImage,
  getCategories,
  getPublishedArticles,
  getSiteSettings
} from "@/lib/content";
import type { SiteSettings } from "@/lib/types";

const todayCards: { title: string; text: string; href: string }[] = [
  { title: "Събития", text: "Концерти, изложби и инициативи в града.", href: "/events" },
  { title: "Място", text: "Разходка в стария град и тихите улички.", href: "/explore" },
  { title: "Уикенд идея", text: "Пирин, гледка, топъл чай и добри обувки.", href: "/nature" },
  { title: "Визуална история", text: "Снимки, светлина и моменти от Банско.", href: "/stories" }
];

function HeroMedia({ settings }: { settings: SiteSettings }) {
  const imageUrl = settings.hero_image_url || settings.default_og_image || fallbackHeroImage;
  const imageAlt = settings.hero_image_alt || "Банско и Пирин";
  const hostedVideoEmbedUrl = getBusinessVideoEmbedUrl(settings.hero_video_url);
  const embedUrl = getBusinessVideoEmbedUrl(settings.hero_embed_url) || settings.hero_embed_url;

  if (settings.hero_media_type === "video" && settings.hero_video_url) {
    if (hostedVideoEmbedUrl) {
      return (
        <iframe
          src={hostedVideoEmbedUrl}
          title="Bansko NOW hero video"
          className="absolute inset-0 h-full w-full scale-110 border-0"
          allow="autoplay; fullscreen; picture-in-picture"
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
        className="absolute inset-0 h-full w-full scale-110 border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return <img src={imageUrl} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />;
}

export default async function HomePage() {
  const [settings, articles, featured, categories] = await Promise.all([
    getSiteSettings(),
    getPublishedArticles({ limit: 6 }),
    getPublishedArticles({ featured: true, limit: 1 }),
    getCategories()
  ]);

  const exploreCategories = categories.filter((category) =>
    ["explore", "nature", "culture", "food"].includes(category.slug)
  );
  const featuredArticle = featured[0] ?? articles[0] ?? null;

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="relative min-h-[78vh] overflow-hidden">
          <HeroMedia settings={settings} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/55" />
          <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase">Bansko NOW</p>
            <h1 className="mt-4 max-w-4xl font-serif text-6xl font-semibold leading-none sm:text-7xl">
              Животът в Банско отблизо
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100">
              Събития, култура, природа, хора и истории от Банско и Пирин.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/now" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100">
                Какво се случва днес
              </Link>
              <Link
                href="/articles"
                className="rounded-full border border-white/70 bg-black/30 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/45"
              >
                Виж последните статии
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-16 sm:px-6 lg:px-8">
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <WeatherWidget />
            <div className="grid gap-4 sm:grid-cols-2">
              {todayCards.map((card) => (
                <Link key={card.title} href={card.href as Route} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
                  <p className="text-xs font-semibold uppercase text-moss">Днес в Банско</p>
                  <h2 className="mt-3 font-serif text-2xl font-semibold text-stone-950">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{card.text}</p>
                </Link>
              ))}
            </div>
          </section>

          <FeaturedArticle article={featuredArticle} />

          <BusinessSpotlightBlock />

          <LatestArticles articles={articles} />

          <section>
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase text-moss">Открий Банско</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">Места, маршрути и сезони</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {(exploreCategories.length ? exploreCategories : categoryDefinitions.slice(2, 6)).map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
            </div>
          </section>

          <ArtStudioNativeBlock />
          <BanskoCollectionBlock />
          <FacebookGroupCTA settings={settings} />

          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-soft sm:p-10">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">Newsletter</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-950">
                  Получавай най-интересното от Банско всяка седмица.
                </h2>
              </div>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Имейл"
                  className="min-w-0 flex-1 rounded-full border border-stone-300 bg-paper px-5 py-3 text-sm"
                  disabled
                />
                <button type="button" className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white">
                  Скоро
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
