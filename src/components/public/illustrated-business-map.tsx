"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  businessCategories,
  getBusinessPath,
  getDirectionsUrl,
  getEffectiveBusinessTier,
  parseBusinessFaqs
} from "@/lib/business-public";
import type { BusinessDirectorySettings, BusinessWithRelations } from "@/lib/types";

export function IllustratedBusinessMap({
  businesses,
  settings
}: {
  businesses: BusinessWithRelations[];
  settings: BusinessDirectorySettings;
}) {
  const [category, setCategory] = useState("Всички");
  const [selectedId, setSelectedId] = useState<string | null>(businesses[0]?.id ?? null);
  const mapBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) =>
          business.show_on_illustrated_map &&
          typeof business.map_pin_x === "number" &&
          typeof business.map_pin_y === "number" &&
          (category === "Всички" || business.category === category)
      ),
    [businesses, category]
  );
  const selected = mapBusinesses.find((business) => business.id === selectedId) ?? mapBusinesses[0] ?? null;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
          <p className="text-sm font-semibold uppercase text-moss">Илюстрирана карта</p>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setSelectedId(null);
            }}
            className="rounded-full border border-stone-300 bg-paper px-4 py-2 text-sm font-semibold"
          >
            <option>Всички</option>
            {businessCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-sage">
          {settings.map_image_url ? (
            <img
              src={settings.map_image_url}
              alt={settings.map_image_alt || "Илюстрирана карта на Банско"}
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-[linear-gradient(135deg,#dfe8d8,#f2eadb)] p-8 text-center">
              <div>
                <p className="font-serif text-4xl font-semibold text-forest">Bansko NOW Map</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-moss">
                  Качи илюстрирана карта от admin, после pin-вай бизнесите с X/Y проценти.
                </p>
              </div>
            </div>
          )}
          {mapBusinesses.map((business) => {
            const tier = getEffectiveBusinessTier(business);
            const premium = tier === "premium" || tier === "homepage";

            return (
              <button
                key={business.id}
                type="button"
                aria-label={business.name}
                onClick={() => setSelectedId(business.id)}
                className={[
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_10px_22px_rgba(0,0,0,0.22)] transition hover:scale-110",
                  premium ? "h-7 w-7 bg-clay" : "h-5 w-5 bg-forest",
                  selected?.id === business.id ? "ring-4 ring-white/70" : ""
                ].join(" ")}
                style={{ left: `${business.map_pin_x}%`, top: `${business.map_pin_y}%` }}
              />
            );
          })}
        </div>
      </div>

      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-soft">
        {selected ? (
          <div>
            {selected.images?.[0] ? (
              <img src={selected.images[0]} alt={selected.name} className="aspect-[4/3] w-full rounded-2xl object-cover" />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">{selected.category}</span>
              {getEffectiveBusinessTier(selected) !== "free" ? (
                <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">Premium</span>
              ) : null}
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-stone-950">{selected.name}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{selected.address}</p>
            {selected.features?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                    {feature}
                  </span>
                ))}
              </div>
            ) : null}
            {parseBusinessFaqs(selected.faqs).slice(0, 2).map((faq) => (
              <details key={faq.question} className="mt-3 rounded-xl bg-stone-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-stone-900">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-stone-600">{faq.answer}</p>
              </details>
            ))}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={getBusinessPath(selected) as Route} className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss">
                Виж профила
              </Link>
              <a
                href={getDirectionsUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
              >
                Упътване
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-stone-650">Когато добавиш pin позиции, бизнесите ще се появят върху картата.</p>
        )}
      </aside>
    </section>
  );
}
