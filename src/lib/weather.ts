import { openMeteoBaseUrl } from "@/lib/env";

export type BanskoWeather = {
  temperature: number | null;
  apparentTemperature: number | null;
  condition: string;
  windSpeed: number | null;
  min: number | null;
  max: number | null;
  precipitationProbability: number | null;
  forecast: BanskoWeatherDay[];
};

export type BanskoWeatherDay = {
  date: string | null;
  label: string;
  condition: string;
  min: number | null;
  max: number | null;
  windSpeed: number | null;
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

const forecastLabels = ["Днес", "Утре", "+2 дни"];

function conditionFromCode(code: number | null | undefined) {
  return typeof code === "number" ? weatherCodes[code] || "Променливо" : "Променливо";
}

function fallbackForecast(): BanskoWeatherDay[] {
  return forecastLabels.map((label) => ({
    date: null,
    label,
    condition: "Очаква данни",
    min: null,
    max: null,
    windSpeed: null,
    precipitationProbability: null
  }));
}

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
    "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max"
  );
  url.searchParams.set("timezone", "Europe/Sofia");
  url.searchParams.set("forecast_days", "3");

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
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        wind_speed_10m_max?: number[];
        precipitation_probability_max?: number[];
      };
    };

    const code = data.current?.weather_code;
    const forecast = forecastLabels.map((label, index) => ({
      date: data.daily?.time?.[index] ?? null,
      label,
      condition: conditionFromCode(data.daily?.weather_code?.[index]),
      min: data.daily?.temperature_2m_min?.[index] ?? null,
      max: data.daily?.temperature_2m_max?.[index] ?? null,
      windSpeed: data.daily?.wind_speed_10m_max?.[index] ?? null,
      precipitationProbability: data.daily?.precipitation_probability_max?.[index] ?? null
    }));

    return {
      temperature: data.current?.temperature_2m ?? null,
      apparentTemperature: data.current?.apparent_temperature ?? null,
      condition: conditionFromCode(code),
      windSpeed: data.current?.wind_speed_10m ?? null,
      min: forecast[0]?.min ?? null,
      max: forecast[0]?.max ?? null,
      precipitationProbability: forecast[0]?.precipitationProbability ?? null,
      forecast
    };
  } catch {
    return {
      temperature: null,
      apparentTemperature: null,
      condition: "Очаква данни",
      windSpeed: null,
      min: null,
      max: null,
      precipitationProbability: null,
      forecast: fallbackForecast()
    };
  }
}
