import { getBanskoWeather } from "@/lib/weather";

function value(number: number | null, suffix: string) {
  return typeof number === "number" ? `${Math.round(number)}${suffix}` : "—";
}

export async function WeatherWidget() {
  const weather = await getBanskoWeather();

  return (
    <section className="rounded-2xl border border-stone-200 bg-[#f5efe3] p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">Времето в Банско</p>
          <p className="mt-2 text-4xl font-semibold text-stone-950">{value(weather.temperature, "°")}</p>
          <p className="mt-1 text-sm text-stone-600">{weather.condition}</p>
        </div>
        <div className="rounded-full bg-sage px-3 py-2 text-sm font-semibold text-forest">
          усеща се {value(weather.apparentTemperature, "°")}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {weather.forecast.map((day) => (
          <article key={day.label} className="grid min-h-[118px] rounded-xl bg-white/75 p-3 text-sm shadow-[0_8px_20px_rgba(38,31,22,0.05)]">
            <div>
              <p className="text-xs font-semibold uppercase text-moss">{day.label}</p>
              <p className="mt-1 line-clamp-1 text-xs text-stone-600">{day.condition}</p>
            </div>
            <div className="mt-3 self-end">
              <p className="font-semibold text-stone-950">
                {value(day.min, "°")} / {value(day.max, "°")}
              </p>
              <dl className="mt-2 grid gap-1 text-[11px] leading-4 text-stone-600">
                <div className="flex items-center justify-between gap-2">
                  <dt>Вятър</dt>
                  <dd className="font-semibold text-stone-900">{value(day.windSpeed, " km/h")}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Валеж</dt>
                  <dd className="font-semibold text-stone-900">{value(day.precipitationProbability, "%")}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
