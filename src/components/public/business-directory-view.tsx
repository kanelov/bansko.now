"use client";

import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/public/business-card";
import { getEffectiveBusinessTier } from "@/lib/business-public";
import type { BusinessWithRelations } from "@/lib/types";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function BusinessDirectoryView({ businesses, locale = "bg" }: { businesses: BusinessWithRelations[]; locale?: Locale }) {
  const all = "__all__";
  const dictionary = getDictionary(locale);
  const [category, setCategory] = useState(all);
  const [feature, setFeature] = useState(all);
  const categories = useMemo(() => Array.from(new Set(businesses.map((business) => business.category))).sort(), [businesses]);
  const features = useMemo(() => Array.from(new Set(businesses.flatMap((business) => business.features ?? []))).sort(), [businesses]);

  const filtered = useMemo(
    () =>
      businesses.filter((business) => {
        const matchesCategory = category === all || business.category === category;
        const matchesFeature = feature === all || business.features?.includes(feature);
        return matchesCategory && matchesFeature;
      }),
    [businesses, category, feature]
  );
  return (
    <section className="grid gap-8">
      <div className="flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800"
        >
          <option value={all}>{dictionary.allCategories}</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={feature}
          onChange={(event) => setFeature(event.target.value)}
          className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800"
        >
          <option value={all}>{locale === "en" ? "All features" : "Всички характеристики"}</option>
          {features.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((business) => {
            const tier = getEffectiveBusinessTier(business);
            const isWide = tier === "premium" || tier === "homepage";

            return (
              <div key={business.id} className={isWide ? "sm:col-span-2 lg:col-span-3" : ""}>
                <BusinessCard business={business} wide={isWide} locale={locale} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-stone-650 shadow-soft">
          {locale === "en" ? "No businesses match these filters. Try another category or feature." : "Няма бизнеси за тези филтри. Опитай с друга категория или характеристика."}
        </div>
      )}
    </section>
  );
}
