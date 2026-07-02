import Link from "next/link";
import type { Route } from "next";
import { BusinessMedia } from "@/components/public/business-media";
import { getBusinessPath, getDirectionsUrl, getEffectiveBusinessTier } from "@/lib/business-public";
import { getHomepageSpotlightBusiness } from "@/lib/businesses";

export async function BusinessSpotlightBlock() {
  const business = await getHomepageSpotlightBusiness();

  if (!business) {
    return null;
  }

  const tier = getEffectiveBusinessTier(business);

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-soft md:grid md:grid-cols-[0.95fr_1.05fr]">
      <BusinessMedia business={business} className="aspect-[4/3] h-full overflow-hidden bg-sage" preferVideo />
      <div className="p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase text-moss">Местен фокус</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">{business.category}</span>
          <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">
            {tier === "homepage" ? "Spotlight" : "Premium"}
          </span>
        </div>
        <h2 className="mt-5 font-serif text-4xl font-semibold text-stone-950">{business.name}</h2>
        <p className="mt-4 text-base leading-7 text-stone-650">{business.description || business.address}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={getBusinessPath(business) as Route} className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss">
            Виж профила
          </Link>
          <a
            href={getDirectionsUrl(business)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
          >
            Упътване
          </a>
        </div>
      </div>
    </section>
  );
}
