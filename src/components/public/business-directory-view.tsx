"use client";

import { useMemo, useState } from "react";
import { BusinessCard, type BusinessCardData } from "@/components/public/business-card";
import { getEffectiveBusinessTier } from "@/lib/business-public";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Колко карти се показват наведнъж; „Покажи още“ добавя следващата порция. */
const pageSize = 24;

const selectClass = "rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800";

function normalize(value: string | null | undefined) {
  return (value ?? "").toLocaleLowerCase("bg").replace(/\s+/g, " ").trim();
}

export function BusinessDirectoryView({ businesses, locale = "bg" }: { businesses: BusinessCardData[]; locale?: Locale }) {
  const all = "__all__";
  const dictionary = getDictionary(locale);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(all);
  const [subcategory, setSubcategory] = useState(all);
  const [feature, setFeature] = useState(all);
  const [limit, setLimit] = useState(pageSize);

  const categories = useMemo(() => Array.from(new Set(businesses.map((business) => business.category))).sort(), [businesses]);
  const subcategories = useMemo(
    () =>
      Array.from(
        new Set(
          businesses
            .filter((business) => category === all || business.category === category)
            .map((business) => business.subcategory ?? "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, locale)),
    [businesses, category, locale]
  );
  const features = useMemo(() => Array.from(new Set(businesses.flatMap((business) => business.features ?? []))).sort(), [businesses]);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return businesses.filter((business) => {
      const matchesCategory = category === all || business.category === category;
      const matchesSubcategory = subcategory === all || business.subcategory === subcategory;
      const matchesFeature = feature === all || business.features?.includes(feature);
      const matchesQuery =
        !needle ||
        [business.name, business.subcategory, business.address, business.description, ...(business.features ?? [])]
          .some((field) => normalize(field).includes(needle));
      return matchesCategory && matchesSubcategory && matchesFeature && matchesQuery;
    });
  }, [businesses, category, subcategory, feature, query]);

  const visible = filtered.slice(0, limit);
  const resetAndSet = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setLimit(pageSize);
  };

  return (
    <section className="grid gap-8">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(pageSize);
          }}
          placeholder={locale === "en" ? "Search by name, type or street" : "Търси по име, вид или улица"}
          aria-label={locale === "en" ? "Search businesses" : "Търсене в бизнесите"}
          className="min-w-0 flex-1 basis-64 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-800 placeholder:text-stone-400"
        />
        <select value={category} onChange={(event) => { resetAndSet(setCategory)(event.target.value); setSubcategory(all); }} className={selectClass}>
          <option value={all}>{dictionary.allCategories}</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        {subcategories.length > 1 ? (
          <select value={subcategory} onChange={(event) => resetAndSet(setSubcategory)(event.target.value)} className={selectClass}>
            <option value={all}>{locale === "en" ? "All types" : "Всички видове"}</option>
            {subcategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        ) : null}
        {features.length ? (
          <select value={feature} onChange={(event) => resetAndSet(setFeature)(event.target.value)} className={selectClass}>
            <option value={all}>{locale === "en" ? "All features" : "Всички характеристики"}</option>
            {features.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        ) : null}
      </div>

      <p className="-mt-4 text-sm text-stone-500">
        {locale === "en" ? `${filtered.length} businesses` : `${filtered.length} бизнеса`}
      </p>

      {filtered.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((business) => {
              const tier = getEffectiveBusinessTier(business);
              const isWide = tier === "premium" || tier === "homepage";

              return (
                <div key={business.id} className={isWide ? "sm:col-span-2 lg:col-span-3" : ""}>
                  <BusinessCard business={business} wide={isWide} locale={locale} />
                </div>
              );
            })}
          </div>
          {filtered.length > visible.length ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((current) => current + pageSize)}
                className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
              >
                {locale === "en" ? `Show more (${filtered.length - visible.length})` : `Покажи още (${filtered.length - visible.length})`}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-stone-650 shadow-soft">
          {locale === "en" ? "No businesses match these filters. Try another category or feature." : "Няма бизнеси за тези филтри. Опитай с друга категория или характеристика."}
        </div>
      )}
    </section>
  );
}
