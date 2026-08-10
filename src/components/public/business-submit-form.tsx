"use client";

import { useState } from "react";
import { submitBusinessAction } from "@/app/(site)/[locale]/businesses/actions";
import { annualPlanDescriptions, getBusinessTierLabel } from "@/lib/business-plan-labels";
import { businessCategories, businessFeatures, businessServices } from "@/lib/business-public";
import type { BusinessDirectorySettings, BusinessListingPlan, Locale } from "@/lib/types";

export function BusinessSubmitForm({
  plans,
  settings,
  locale = "bg"
}: {
  plans: BusinessListingPlan[];
  settings: BusinessDirectorySettings;
  locale?: Locale;
}) {
  const english = locale === "en";
  const categories = english
    ? ["Restaurants", "Cafes", "Hotels", "Guest houses", "Services", "Shops", "Activities", "Health and sport", "Transport", "Culture"]
    : businessCategories;
  const features = english
    ? ["Wi-Fi", "Parking", "Card payments", "Pet friendly", "Family friendly", "Delivery", "Open year-round", "English spoken", "Terrace", "Wheelchair accessible"]
    : businessFeatures;
  const services = english
    ? ["Professional photography", "Video presentation", "Drone footage", "Design and visual identity", "I would like a custom offer"]
    : businessServices;
  const [faqRows, setFaqRows] = useState([0]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedImageCount, setSelectedImageCount] = useState(0);
  const annualPlans = plans.filter((plan) => plan.period_months === 12 && plan.tier !== "free");
  const selectedPlan = annualPlans.find((plan) => plan.id === selectedPlanId);

  return (
    <form
      action={submitBusinessAction}
      className="mx-auto grid w-full max-w-4xl gap-8 [&_input]:min-w-0 [&_select]:min-w-0 [&_select]:w-full [&_textarea]:min-w-0 [&_textarea]:w-full"
    >
      <input type="hidden" name="locale" value={locale} />
      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">{english ? "Basic information" : "Основна информация"}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-950 sm:text-3xl">{english ? "Present your business" : "Представи бизнеса си"}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            {english ? "Business name" : "Име на бизнеса"}
            <input name="name" required className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {english ? "Category" : "Категория"}
            <select name="category" required className="rounded-xl border border-stone-300 px-4 py-3">
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          {english ? "Short description" : "Кратко описание"}
          <textarea name="description" rows={4} className="rounded-xl border border-stone-300 px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {english ? "Address" : "Адрес"}
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
            {english ? "Video link" : "Видео линк"}
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
          <p className="text-sm font-semibold uppercase text-moss">{english ? "Visual presentation" : "Визуално представяне"}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-950 sm:text-3xl">{english ? "Images and features" : "Снимки и характеристики"}</h2>
        </div>
        <label className="grid cursor-pointer gap-2 text-sm font-semibold">
          <span>{english ? "Images, up to 2MB each" : "Снимки, до 2MB всяка"}</span>
          <input
            name="business_images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => setSelectedImageCount(event.target.files?.length ?? 0)}
            className="sr-only"
          />
          <span className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-300 bg-paper p-3">
            <span className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white">{english ? "Choose images" : "Избери снимки"}</span>
            <span className="text-sm font-medium text-stone-600">
              {selectedImageCount ? `${selectedImageCount} ${english ? "selected" : "избрани"}` : `JPEG, PNG ${english ? "or" : "или"} WEBP`}
            </span>
          </span>
        </label>
        <fieldset>
          <legend className="text-sm font-semibold text-stone-950">{english ? "Amenities and features" : "Удобства и характеристики"}</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <label
              key={feature}
              className="choice-row cursor-pointer rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-sm font-medium text-stone-800 transition hover:border-forest/40 hover:bg-sage/30"
            >
              <input className="choice-control" type="checkbox" name="features" value={feature} />
              <span className="leading-5">{feature}</span>
            </label>
          ))}
          </div>
        </fieldset>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">FAQ</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-950 sm:text-3xl">{english ? "Questions and answers" : "Въпроси и отговори"}</h2>
        </div>
        {faqRows.map((row, index) => (
          <div key={row} className="grid gap-3 rounded-2xl bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-700">{english ? "Question" : "Въпрос"} {index + 1}</p>
              {faqRows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setFaqRows((rows) => rows.filter((item) => item !== row))}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
                >
                  {english ? "Remove" : "Премахни"}
                </button>
              ) : null}
            </div>
            <input name="faq_question" placeholder={english ? "Question" : "Въпрос"} className="rounded-xl border border-stone-300 px-4 py-3" />
            <textarea name="faq_answer" rows={3} placeholder={english ? "Answer" : "Отговор"} className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFaqRows((rows) => [...rows, Math.max(...rows) + 1])}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
        >
          {english ? "Add question" : "Добави въпрос"}
        </button>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">{english ? "Visibility plan" : "План за видимост"}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-950 sm:text-3xl">{settings.premium_offer_title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{settings.premium_offer_description}</p>
        </div>
        <fieldset>
          <legend className="sr-only">{english ? "Choose a visibility plan" : "Избери план за видимост"}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <label
              className={`choice-row cursor-pointer rounded-2xl border p-4 transition ${
                selectedPlanId === "" ? "border-forest bg-sage/40 shadow-sm" : "border-stone-200 bg-white hover:border-forest/40"
              }`}
            >
              <input
                className="choice-control"
                type="radio"
                name="requested_plan_id"
                value=""
                checked={selectedPlanId === ""}
                onChange={() => setSelectedPlanId("")}
              />
              <span>
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-base text-stone-950">{english ? "Free" : "Безплатен"}</strong>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-forest">{english ? "Default" : "По подразбиране"}</span>
                </span>
                <span className="mt-2 block text-sm leading-6 text-stone-600">{english ? "A basic directory profile after editorial approval." : annualPlanDescriptions.free}</span>
              </span>
            </label>

            {annualPlans.map((plan) => {
              const selected = selectedPlanId === plan.id;

              return (
                <label
                  key={plan.id}
                  className={`choice-row cursor-pointer rounded-2xl border p-4 transition ${
                    selected ? "border-forest bg-sage/40 shadow-sm" : "border-stone-200 bg-white hover:border-forest/40"
                  }`}
                >
                  <input
                    className="choice-control"
                    type="radio"
                    name="requested_plan_id"
                    value={plan.id}
                    checked={selected}
                    onChange={() => setSelectedPlanId(plan.id)}
                  />
                  <span>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-base text-stone-950">{getBusinessTierLabel(plan.tier, locale)}</strong>
                      <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-white">{english ? "1 year" : "1 година"}</span>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-stone-600">
                      {english ? (plan.tier === "premium" ? "Stronger visual emphasis and priority position in the directory." : "Top visibility in the directory and a possible homepage spotlight.") : (plan.description || annualPlanDescriptions[plan.tier])}
                    </span>
                    {plan.price ? (
                      <span className="mt-3 block text-sm font-semibold text-forest">
                        {plan.price} {plan.currency} / {english ? "year" : "година"}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {selectedPlan ? (
          selectedPlan.stripe_payment_link ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-stone-600">{english ? "Payment opens on a secure Stripe page." : "Плащането се отваря в защитена Stripe страница."}</p>
              <a
                href={selectedPlan.stripe_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-forest px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-moss"
              >
                {english ? "Pay with Stripe" : "Плати със Stripe"}
              </a>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
              {english ? "A Stripe link has not been added for this plan yet. Submit your request and we will contact you with an offer." : "За това ниво все още няма добавен Stripe линк. Изпрати заявката и ще се свържем с теб с оферта."}
            </div>
          )
        ) : null}

        <fieldset>
          <legend className="text-sm font-semibold text-stone-950">{english ? "Optional additional services" : "Допълнителни услуги по желание"}</legend>
          <p className="mt-1 text-sm leading-6 text-stone-600">{english ? "Optional. We will discuss pricing and availability separately." : "Изборът не е задължителен. Ще уточним цена и възможности отделно."}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <label
                key={service}
                className="choice-row cursor-pointer rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-sm font-medium text-stone-800 transition hover:border-forest/40 hover:bg-sage/30"
              >
                <input className="choice-control" type="checkbox" name="requested_services" value={service} />
                <span className="leading-5">{service}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="grid w-full min-w-0 gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">{english ? "Private admin contact" : "Контакт за администратора"}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-950 sm:text-3xl">{english ? "Who is submitting this listing?" : "Кой изпраща заявката?"}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            {english ? "Name" : "Име"}
            <input name="owner_name" required className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {english ? "Phone" : "Телефон"}
            <input name="owner_phone" className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {english ? "Email" : "Имейл"}
            <input name="owner_email" type="email" required className="rounded-xl border border-stone-300 px-4 py-3" />
          </label>
        </div>
      </section>

      <button type="submit" className="justify-self-center rounded-full bg-forest px-8 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-moss">
        {english ? "Submit for review" : "Изпрати за преглед"}
      </button>
    </form>
  );
}
