"use client";

import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/public/business-card";
import { businessCategories, businessFeatures, getEffectiveBusinessTier } from "@/lib/business-public";
import type { BusinessWithRelations } from "@/lib/types";

export function BusinessDirectoryView({ businesses }: { businesses: BusinessWithRelations[] }) {
  const [category, setCategory] = useState("Всички");
  const [feature, setFeature] = useState("Всички");

  const filtered = useMemo(
    () =>
      businesses.filter((business) => {
        const matchesCategory = category === "Всички" || business.category === category;
        const matchesFeature = feature === "Всички" || business.features?.includes(feature);
        return matchesCategory && matchesFeature;
      }),
    [businesses, category, feature]
  );
  const firstPremiumIndex = filtered.findIndex((business) => {
    const tier = getEffectiveBusinessTier(business);
    return tier === "premium" || tier === "homepage";
  });

  return (
    <section className="grid gap-8">
      <div className="flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800"
        >
          <option>Всички</option>
          {businessCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={feature}
          onChange={(event) => setFeature(event.target.value)}
          className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800"
        >
          <option>Всички</option>
          {businessFeatures.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((business, index) => (
            <div key={business.id} className={index === firstPremiumIndex ? "md:col-span-2" : ""}>
              <BusinessCard business={business} featured={index === firstPremiumIndex} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-stone-650 shadow-soft">
          Няма бизнеси за тези филтри. Опитай с друга категория или характеристика.
        </div>
      )}
    </section>
  );
}
