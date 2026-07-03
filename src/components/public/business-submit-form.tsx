"use client";

import { useState } from "react";
import { submitBusinessAction } from "@/app/businesses/actions";
import { businessCategories, businessFeatures, businessServices } from "@/lib/business-public";
import type { BusinessDirectorySettings, BusinessListingPlan } from "@/lib/types";

export function BusinessSubmitForm({
  plans,
  settings
}: {
  plans: BusinessListingPlan[];
  settings: BusinessDirectorySettings;
}) {
  const [faqRows, setFaqRows] = useState([0]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  return (
    <form
      action={submitBusinessAction}
      className="mx-auto grid w-full max-w-4xl gap-8 [&_input]:min-w-0 [&_input]:w-full [&_select]:min-w-0 [&_select]:w-full [&_textarea]:min-w-0 [&_textarea]:w-full"
    >
      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Основна информация</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">Представи бизнеса си</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Име на бизнеса
            <input name="name" required className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Категория
            <select name="category" required className="rounded-xl border border-stone-300 px-4 py-3">
              {businessCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Кратко описание
          <textarea name="description" rows={4} className="rounded-xl border border-stone-300 px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Адрес
          <input name="address" required className="rounded-xl border border-stone-300 px-4 py-3" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Latitude
            <input name="latitude" inputMode="decimal" placeholder="41.8383" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Longitude
            <input name="longitude" inputMode="decimal" placeholder="23.4885" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            Видео линк
            <input name="video_link" placeholder="YouTube / Vimeo" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Website
            <input name="website_url" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Instagram
            <input name="instagram_url" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Facebook
          <input name="facebook_url" className="rounded-xl border border-stone-300 px-4 py-3" />
        </label>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Визуално представяне</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">Снимки и характеристики</h2>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Снимки, до 2MB всяка
          <input
            name="business_images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="max-w-full rounded-xl border border-stone-300 bg-paper px-3 py-3 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white sm:px-4 sm:text-sm sm:file:px-4 sm:file:text-sm"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {businessFeatures.map((feature) => (
            <label key={feature} className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-medium">
              <input type="checkbox" name="features" value={feature} />
              {feature}
            </label>
          ))}
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">FAQ</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">Въпроси и отговори</h2>
        </div>
        {faqRows.map((row) => (
          <div key={row} className="grid gap-3 rounded-2xl bg-stone-50 p-4">
            <input name="faq_question" placeholder="Въпрос" className="rounded-xl border border-stone-300 px-4 py-3" />
            <textarea name="faq_answer" rows={3} placeholder="Отговор" className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFaqRows((rows) => [...rows, Date.now()])}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
        >
          Добави въпрос
        </button>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">План за видимост</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{settings.premium_offer_title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{settings.premium_offer_description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Избран план
            <select
              name="requested_plan_id"
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="rounded-xl border border-stone-300 px-4 py-3"
            >
              <option value="">Free listing</option>
              {plans
                .filter((plan) => plan.tier !== "free")
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} {plan.price ? `- ${plan.price} ${plan.currency}` : ""}
                  </option>
                ))}
            </select>
          </label>
          {selectedPlan?.stripe_payment_link ? (
            <a
              href={selectedPlan.stripe_payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="self-end rounded-full bg-forest px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-moss"
            >
              Плати със Stripe
            </a>
          ) : (
            <div className="self-end rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
              Ако избереш платен план без линк, ще се свържем с теб с оферта.
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {businessServices.map((service) => (
            <label key={service} className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-medium">
              <input type="checkbox" name="requested_services" value={service} />
              {service}
            </label>
          ))}
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Контакт за администратора</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">Кой изпраща заявката?</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            Име
            <input name="owner_name" required className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Телефон
            <input name="owner_phone" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Имейл
            <input name="owner_email" type="email" required className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
        </div>
      </section>

      <button type="submit" className="justify-self-center rounded-full bg-forest px-8 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-moss">
        Изпрати за преглед
      </button>
    </form>
  );
}
