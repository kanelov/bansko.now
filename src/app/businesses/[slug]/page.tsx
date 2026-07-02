import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FacebookGroupCTA } from "@/components/public/facebook-group-cta";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getDirectionsUrl, parseBusinessFaqs } from "@/lib/business-public";
import { getBusinessBySlug } from "@/lib/businesses";
import { getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return { title: "Бизнесът не е намерен" };
  }

  return {
    title: business.seo_title || `${business.name} в Банско | Bansko NOW`,
    description: business.seo_description || business.description || `${business.name} - ${business.category} в Банско.`,
    alternates: { canonical: `${siteUrl}/businesses/${business.slug}` },
    openGraph: {
      title: business.name,
      description: business.description || business.address,
      images: business.images?.[0] ? [business.images[0]] : undefined,
      type: "website"
    }
  };
}

export default async function BusinessProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [business, settings] = await Promise.all([getBusinessBySlug(slug), getSiteSettings()]);

  if (!business) {
    notFound();
  }

  const faqs = parseBusinessFaqs(business.faqs);
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    image: business.images || [],
    address: business.address,
    url: `${siteUrl}/businesses/${business.slug}`,
    telephone: undefined,
    geo:
      typeof business.latitude === "number" && typeof business.longitude === "number"
        ? {
            "@type": "GeoCoordinates",
            latitude: business.latitude,
            longitude: business.longitude
          }
        : undefined
  };
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }
    : null;

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="relative min-h-[58vh] overflow-hidden bg-forest text-white">
          {business.images?.[0] ? (
            <img src={business.images[0]} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-70" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/65" />
          <div className="relative mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase">{business.category}</p>
            <h1 className="mt-3 max-w-4xl font-serif text-5xl font-semibold sm:text-6xl">{business.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-100">{business.address}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={getDirectionsUrl(business)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-stone-100">
                Упътване
              </a>
              {business.website_url ? (
                <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Website
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:px-8">
          {business.description ? (
            <section className="text-xl leading-9 text-stone-700">
              <p>{business.description}</p>
            </section>
          ) : null}

          {business.images && business.images.length > 1 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              {business.images.slice(1).map((image) => (
                <img key={image} src={image} alt={business.name} className="aspect-[4/3] rounded-2xl object-cover" loading="lazy" />
              ))}
            </section>
          ) : null}

          {business.video_link ? (
            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase text-moss">Видео</p>
              <a href={business.video_link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss">
                Отвори видеото
              </a>
            </section>
          ) : null}

          {business.features?.length ? (
            <section>
              <p className="text-sm font-semibold uppercase text-moss">Удобства</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {business.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-soft">
                    {feature}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {faqs.length ? (
            <section>
              <p className="text-sm font-semibold uppercase text-moss">Въпроси</p>
              <div className="mt-4 grid gap-3">
                {faqs.map((faq) => (
                  <details key={faq.question} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
                    <summary className="cursor-pointer font-semibold text-stone-950">{faq.question}</summary>
                    <p className="mt-3 leading-7 text-stone-650">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <FacebookGroupCTA settings={settings} />
        </div>
      </main>
      <SiteFooter settings={settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
    </div>
  );
}
