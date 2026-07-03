import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtStudioNativeBlock } from "@/components/public/art-studio-native-block";
import { ArticleCard } from "@/components/public/article-card";
import { BanskoCollectionBlock } from "@/components/public/bansko-collection-block";
import { CategoryCard } from "@/components/public/category-card";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { FeaturedArticle } from "@/components/public/featured-article";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getCategories, getCategoryBySlug, getPublishedArticles, getSiteSettings } from "@/lib/content";

type Params = Promise<{ categorySlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return {};
  }

  return {
    title: {
      absolute: category.seo_title || `${category.name} | Bansko NOW`
    },
    description: category.seo_description || category.description || undefined,
    alternates: {
      canonical: category.canonical_url || `/${category.slug}`
    },
    openGraph: {
      title: category.og_title || category.seo_title || category.name,
      description: category.og_description || category.seo_description || category.description || undefined,
      images: category.og_image_url ? [category.og_image_url] : undefined,
      type: "website"
    },
    robots: {
      index: category.robots_index ?? true,
      follow: category.robots_follow ?? true
    }
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { categorySlug } = await params;
  const [category, settings, categories, articles] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getSiteSettings(),
    getCategories(),
    getPublishedArticles({ categorySlug, limit: 24 })
  ]);

  if (!category) {
    notFound();
  }

  const [featured, ...rest] = articles;
  const relatedCategories = categories
    .filter((item) => item.slug !== category.slug)
    .filter((item) => ["events", "explore", "nature", "culture", "living", "food"].includes(item.slug))
    .slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@type": category.schema_type || "CollectionPage",
    name: category.name,
    description: category.description,
    url: `/${category.slug}`
  };

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:px-8">
        <header className="max-w-4xl">
          <p className="text-sm font-semibold uppercase text-moss">Bansko NOW</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-stone-950">{category.name}</h1>
          {category.description ? (
            <p className="mt-5 text-lg leading-8 text-stone-650">{category.description}</p>
          ) : null}
        </header>

        <FeaturedArticle article={featured ?? null} />

        <section>
          <h2 className="font-serif text-3xl font-semibold text-stone-950">Последни статии</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(rest.length ? rest : articles).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        {category.slug === "art-studio" || category.slug === "culture" ? <ArtStudioNativeBlock /> : null}
        {category.slug === "bansko-collection" || category.slug === "explore" ? <BanskoCollectionBlock /> : null}

        <section>
          <h2 className="font-serif text-3xl font-semibold text-stone-950">Свързани категории</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {relatedCategories.map((item) => (
              <CategoryCard key={item.slug} category={item} />
            ))}
          </div>
        </section>

        <FacebookGroupCTA settings={settings} />
      </main>
      <SiteFooter settings={settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
