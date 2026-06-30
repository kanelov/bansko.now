import { openMeteoBaseUrl } from "@/lib/env";

export type BanskoWeather = {
  temperature: number | null;
  apparentTemperature: number | null;
  condition: string;
  windSpeed: number | null;
  min: number | null;
  max: number | null;
  precipitationProbability: number | null;
};

const weatherCodes: Record<number, string> = {
  0: "Ясно",
  1: "Предимно ясно",
  2: "Разкъсана облачност",
  3: "Облачно",
  45: "Мъгла",
  48: "Мъгла със скреж",
  51: "Слаб ръмеж",
  53: "Ръмеж",
  55: "Силен ръмеж",
  61: "Слаб дъжд",
  63: "Дъжд",
  65: "Силен дъжд",
  71: "Слаб сняг",
  73: "Сняг",
  75: "Силен сняг",
  80: "Кратък дъжд",
  81: "Дъждовно",
  82: "Силен валеж",
  95: "Буря"
};

export async function getBanskoWeather(): Promise<BanskoWeather> {
  const url = new URL(openMeteoBaseUrl);
  url.searchParams.set("latitude", "41.8383");
  url.searchParams.set("longitude", "23.4885");
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,wind_speed_10m"
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  );
  url.searchParams.set("timezone", "Europe/Sofia");
  url.searchParams.set("forecast_days", "1");

  try {
    const response = await fetch(url, { next: { revalidate: 1800 } });

    if (!response.ok) {
      throw new Error("Weather request failed.");
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };

    const code = data.current?.weather_code;

    return {
      temperature: data.current?.temperature_2m ?? null,
      apparentTemperature: data.current?.apparent_temperature ?? null,
      condition: typeof code === "number" ? weatherCodes[code] || "Променливо" : "Променливо",
      windSpeed: data.current?.wind_speed_10m ?? null,
      min: data.daily?.temperature_2m_min?.[0] ?? null,
      max: data.daily?.temperature_2m_max?.[0] ?? null,
      precipitationProbability: data.daily?.precipitation_probability_max?.[0] ?? null
    };
  } catch {
    return {
      temperature: null,
      apparentTemperature: null,
      condition: "Очаква данни",
      windSpeed: null,
      min: null,
      max: null,
      precipitationProbability: null
    };
  }
}
