import { getBanskoWeather } from "@/lib/weather";

function value(number: number | null, suffix: string) {
  return typeof number === "number" ? `${Math.round(number)}${suffix}` : "—";
}

export async function WeatherWidget() {
  const weather = await getBanskoWeather();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
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
      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-500">Мин / Макс</p>
          <p className="mt-1 font-semibold text-stone-900">
            {value(weather.min, "°")} / {value(weather.max, "°")}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-500">Вятър</p>
          <p className="mt-1 font-semibold text-stone-900">{value(weather.windSpeed, " km/h")}</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-500">Валеж</p>
          <p className="mt-1 font-semibold text-stone-900">
            {value(weather.precipitationProbability, "%")}
          </p>
        </div>
      </div>
    </section>
  );
}
