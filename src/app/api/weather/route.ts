import { NextResponse } from "next/server";
import { getBanskoWeather } from "@/lib/weather";

export async function GET() {
  const weather = await getBanskoWeather();

  return NextResponse.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
