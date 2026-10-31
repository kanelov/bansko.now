"use client";

import { useState } from "react";
import type { CinemaDay } from "@/lib/cinema";
import type { Locale } from "@/lib/types";

/** Малък клиентски компонент: само превключвателят Днес / Утре / <ден>. Данните идват готови от сървъра. */
export function CinemaDayTabs({ days, locale, eyebrow, ticketsUrl, footer }: { days: CinemaDay[]; locale: Locale; eyebrow: string; ticketsUrl: string; footer: string }) {
  const firstWithFilms = Math.max(0, days.findIndex((day) => day.screenings.length));
  const [active, setActive] = useState(firstWithFilms);
  const day = days[active] ?? days[0];
  const en = locale === "en";
  const count = day.screenings.length;
  const filmsLabel = en ? `${count} ${count === 1 ? "film" : "films"}` : `${count} ${count === 1 ? "филм" : "филма"}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">{eyebrow}</p>
          <p className="mt-1 text-sm text-stone-600">
            <span className="capitalize">{day.longLabel}</span> · {filmsLabel}
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/70 p-1" role="tablist" aria-label={en ? "Day" : "Ден"}>
          {days.map((item, index) => (
            <button
              key={item.date}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${index === active ? "bg-forest text-white" : "text-stone-600 hover:bg-white"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid">
        {day.screenings.length ? (
          day.screenings.map((film, index) => {
            const meta = [film.times[0]?.hall, film.format, film.language, film.age].filter(Boolean).join(" · ");
            return (
              <div key={`${film.title}-${index}`} className={`flex items-center justify-between gap-3 py-2.5 ${index ? "border-t border-dashed border-stone-300" : "pt-1"}`}>
                <div className="grid min-w-0 gap-0.5">
                  <p className="text-sm font-semibold leading-tight text-stone-950">{film.title}</p>
                  {meta ? <p className="text-[11px] text-stone-600">{meta}</p> : null}
                </div>
                <div className="flex max-w-[46%] flex-wrap justify-end gap-1">
                  {film.times.map((slot) => (
                    <a
                      key={slot.time}
                      href={slot.url ?? film.url ?? ticketsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={en ? "Tickets at kinoarena.com" : "Билети в kinoarena.com"}
                      className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-bold text-forest transition hover:border-forest hover:bg-forest hover:text-white"
                    >
                      {slot.time}
                    </a>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-3 text-sm text-stone-600">{en ? "No screenings listed for this day." : "Няма обявени прожекции за този ден."}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-stone-300 pt-3 text-xs text-stone-600">
        <span>{footer}</span>
        <a href={ticketsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest hover:underline">
          {en ? "Tickets and the full week ↗" : "Билети и цялата седмица ↗"}
        </a>
      </div>
    </>
  );
}
