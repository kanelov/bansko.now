import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

/**
 * Ограничаване на опитите за вход в портала и в админа. Броенето е в базата
 * (функцията register_login_attempt), защото Vercel функциите нямат обща памет.
 * Пазят се само отпечатъци (SHA-256) на имейла и на адреса на посетителя.
 *
 * Връща false, когато опитите за последните 15 минути са надхвърлени. При
 * грешка в базата пуска входа (fail open): по-добре без ограничение за минута,
 * отколкото собственикът да не може да си отвори менюто.
 */

function fingerprint(kind: string, value: string) {
  return createHash("sha256").update(`bansko-now:${kind}:${value}`).digest("hex");
}

export async function isLoginAllowed(email: string): Promise<boolean> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return true;
  }

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";

  try {
    const { data, error } = await supabase.rpc("register_login_attempt", {
      p_email_hash: fingerprint("email", email.trim().toLowerCase()),
      p_ip_hash: fingerprint("ip", ip)
    });

    return error ? true : data !== false;
  } catch {
    return true;
  }
}
