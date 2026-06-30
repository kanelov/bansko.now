import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminClaims = {
  app_metadata?: {
    role?: string;
    roles?: string[];
  };
};

export function hasAdminRole(claims: unknown) {
  const appMetadata = (claims as AdminClaims | null)?.app_metadata;
  return appMetadata?.role === "admin" || appMetadata?.roles?.includes("admin") || false;
}

export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase: null, claims: null, isAdmin: false };
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims =
    (data as { claims?: unknown; user?: unknown } | null)?.claims ??
    (data as { claims?: unknown; user?: unknown } | null)?.user ??
    null;

  if (error || !claims) {
    return { supabase, claims: null, isAdmin: false };
  }

  return { supabase, claims, isAdmin: hasAdminRole(claims) };
}

export async function requireAdmin() {
  const { supabase, claims, isAdmin } = await getAdminSession();

  if (!supabase || !claims) {
    redirect("/admin/login");
  }

  if (!isAdmin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }

  return { supabase, claims };
}
