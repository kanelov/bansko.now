import Link from "next/link";
import type { Route } from "next";
import { BusinessMedia } from "@/components/public/business-media";
import { getBusinessPath, getDirectionsUrl, getEffectiveBusinessTier } from "@/lib/business-public";
import type { BusinessWithRelations } from "@/lib/types";

export function BusinessCard({ business, featured = false }: { business: BusinessWithRelations; featured?: boolean }) {
  const tier = getEffectiveBusinessTier(business);
  const isPremium = tier === "premium" || tier === "homepage";

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(38,31,22,0.13)]",
        isPremium || featured ? "border-forest/25 md:grid md:grid-cols-[1.05fr_0.95fr]" : "border-stone-200"
      ].join(" ")}
    >
      <BusinessMedia business={business} className={`aspect-[4/3] overflow-hidden bg-sage ${isPremium || featured ? "h-full min-h-64" : ""}`} />
      <div className="flex flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">{business.category}</span>
          {tier !== "free" ? (
            <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">
              {tier === "homepage" ? "Spotlight" : tier === "premium" ? "Premium" : "Featured"}
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
          <Link href={getBusinessPath(business) as Route} className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss">
            Виж профила
          </Link>
          <a
            href={getDirectionsUrl(business)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
          >
            Упътване
          </a>
        </div>
      </div>
    </article>
  );
}
