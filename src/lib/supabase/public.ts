import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/types";

let publicClient: SupabaseClient<Database> | null | undefined;

export function createPublicSupabaseClient(): SupabaseClient<Database> | null {
  if (publicClient !== undefined) {
    return publicClient;
  }

  const config = getSupabaseConfig();

  publicClient = config
    ? createClient<Database>(config.url, config.anonKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false
        }
      })
    : null;

  return publicClient;
}
