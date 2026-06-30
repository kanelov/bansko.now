export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bansko.now";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export const openMeteoBaseUrl =
  process.env.OPEN_METEO_API_BASE_URL || "https://api.open-meteo.com/v1/forecast";
