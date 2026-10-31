import Link from "next/link";
import type { Route } from "next";
import { BusinessMedia } from "@/components/public/business-media";
import { getBusinessTierLabel } from "@/lib/business-plan-labels";
import { getBusinessPath, getDirectionsUrl, getEffectiveBusinessTier } from "@/lib/business-public";
import type { BusinessWithRelations } from "@/lib/types";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Само полетата, които картата показва: списъкът /places праща тях на браузъра, не целия запис. */
export type BusinessCardData = Pick<
  BusinessWithRelations,
  | "id" | "slug" | "name" | "category" | "subcategory" | "address" | "description" | "features"
  | "latitude" | "longitude" | "images" | "video_link" | "image_alt" | "placeholder_image_url"
  | "listing_tier" | "paid_until" | "payment_status"
>;

export function toBusinessCardData(business: BusinessWithRelations): BusinessCardData {
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    category: business.category,
    subcategory: business.subcategory ?? null,
    address: business.address,
    description: business.description ? business.description.slice(0, 220) : null,
    features: business.features ?? [],
    latitude: business.latitude,
    longitude: business.longitude,
    images: business.images?.length ? [business.images[0]] : [],
    video_link: business.video_link,
    image_alt: business.image_alt ?? null,
    placeholder_image_url: business.placeholder_image_url ?? null,
    listing_tier: business.listing_tier,
    paid_until: business.paid_until,
    payment_status: business.payment_status
  };
}

export function BusinessCard({ business, wide = false, locale = "bg" }: { business: BusinessCardData; wide?: boolean; locale?: Locale }) {
  const tier = getEffectiveBusinessTier(business);
  const dictionary = getDictionary(locale);

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(38,31,22,0.13)]",
        wide ? "border-forest/25 lg:grid lg:grid-cols-[1.05fr_0.95fr]" : "border-stone-200"
      ].join(" ")}
    >
      <BusinessMedia business={business} className={`aspect-[4/3] overflow-hidden bg-sage ${wide ? "lg:h-full lg:min-h-72" : ""}`} />
      <div className="flex flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">{business.category}</span>
          {business.subcategory ? (
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600">{business.subcategory}</span>
          ) : null}
          {tier !== "free" ? (
            <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">
              {getBusinessTierLabel(tier, locale)}
            </span>
          ) : null}
        </div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-stone-950">{business.name}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{business.address}</p>
        {business.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-650">{business.description}</p>
        ) : null}
        {business.features?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {business.features.slice(0, 4).map((feature) => (
              <span key={feature} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {feature}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={getBusinessPath(business, locale) as Route} className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss hover:text-white">
            {dictionary.viewBusiness}
          </Link>
          <a
            href={getDirectionsUrl(business)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
          >
            {dictionary.directions}
          </a>
        </div>
      </div>
    </article>
  );
}
