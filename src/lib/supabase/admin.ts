import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig, supabaseServiceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/types";

let adminClient: SupabaseClient<Database> | null | undefined;

export function createSupabaseAdminClient(): SupabaseClient<Database> | null {
  if (adminClient !== undefined) {
    return adminClient;
  }

  const config = getSupabaseConfig();
  if (!config || !supabaseServiceRoleKey) {
    adminClient = null;
    return adminClient;
  }

  adminClient = createClient<Database>(config.url, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });

  return adminClient;
}
