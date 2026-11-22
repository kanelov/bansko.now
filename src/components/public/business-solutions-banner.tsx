import Link from "next/link";
import type { Route } from "next";
import { IconGlyph } from "@/components/public/icon-glyph";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/**
 * Банер „Дигитални решения за бизнеса“ над формата „Добави местен бизнес“
 * (решение на собственика, 22.11.2026): ясно да се вижда, че освен място в
 * каталога Bansko NOW прави и инструменти за самия бизнес. Сървърен компонент,
 * без JavaScript в браузъра.
 */

type Solution = { icon: string; title: string; text: string };

const copy: Record<Locale, { eyebrow: string; title: string; lead: string; price: string; solutions: Solution[]; byType: string; types: string[]; contact: string; login: string }> = {
  bg: {
    eyebrow: "Решения за бизнеса",
    title: "Повече от място в каталога",
    lead: "Правим дигиталните инструменти, от които има нужда заведението, хотелът или магазинът ви – подредени и управлявани от едно място, на български и английски.",
    price: "Всичко в портала от 10 € на месец",
    solutions: [
      { icon: "qrcode", title: "QR и дигитално меню", text: "Менюто на телефона на госта, с цени, размери и „свърши“, сменяно от вас за секунди." },
      { icon: "tv", title: "Екрани в обекта", text: "Меню, снимки, видео и реклами на телевизорите, обновявани от портала." },
      { icon: "calendar-check", title: "Онлайн заявки", text: "Заявки, запитвания и резервации от сайта, според вида на бизнеса." },
      { icon: "globe", title: "Собствена страница", text: "Оформена страница в Bansko NOW със снимки, описание, карта, работно време и линкове." },
      { icon: "clock", title: "Работно време", text: "„Отворено сега“ на страницата и в менюто, с почивни дни и изключения." },
      { icon: "print", title: "Меню за печат", text: "Готово меню A4, A5 или DL с QR код към актуалното меню." }
    ],
    byType: "Според вида бизнес",
    types: ["Ресторанти и кафета", "Хотели и къщи за гости", "Магазини и галерии", "Красота и услуги", "Ски и активности"],
    contact: "Пишете ни",
    login: "Вход за бизнеси"
  },
  en: {
    eyebrow: "Business solutions",
    title: "More than a directory listing",
    lead: "We build the digital tools your restaurant, hotel or shop needs, managed from one place, in Bulgarian and English.",
    price: "Everything in the portal from €10 a month",
    solutions: [
      { icon: "qrcode", title: "QR and digital menu", text: "Your menu on the guest's phone, with prices, sizes and sold-out items you change in seconds." },
      { icon: "tv", title: "Screens on site", text: "Menu, photos, video and promotions on your TVs, updated from the portal." },
      { icon: "calendar-check", title: "Online requests", text: "Requests, enquiries and bookings from the site, shaped to your type of business." },
      { icon: "globe", title: "Your own page", text: "A designed page on Bansko NOW with photos, description, map, opening hours and links." },
      { icon: "clock", title: "Opening hours", text: "“Open now” on your page and menu, with days off and exceptions." },
      { icon: "print", title: "Print menu", text: "A ready A4, A5 or DL menu with a QR code to the live menu." }
    ],
    byType: "By type of business",
    types: ["Restaurants and cafés", "Hotels and guest houses", "Shops and galleries", "Beauty and services", "Ski and activities"],
    contact: "Contact us",
    login: "Business login"
  }
};

export function BusinessSolutionsBanner({ locale }: { locale: Locale }) {
  const text = copy[locale];

  return (
    <section className="overflow-hidden rounded-3xl bg-forest text-white">
      <div className="grid gap-8 p-7 sm:p-10">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">{text.eyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{text.title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{text.lead}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href={localePath(locale, "/contact") as Route}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {text.contact}
              <IconGlyph name="arrow-right" className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={"/business/login" as Route}
              className="inline-flex items-center rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {text.login}
            </Link>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {text.solutions.map((solution) => (
            <li key={solution.title} className="flex gap-3 rounded-2xl bg-white/[0.07] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                <IconGlyph name={solution.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{solution.title}</span>
                <span className="mt-1 block text-sm leading-6 text-white/80">{solution.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-6 text-sm">
          <span className="mr-2 font-semibold text-white/70">{text.byType}:</span>
          {text.types.map((type) => (
            <span key={type} className="rounded-full border border-white/25 px-3 py-1">
              {type}
            </span>
          ))}
          <span className="ml-auto font-semibold">{text.price}</span>
        </div>
      </div>
    </section>
  );
}
