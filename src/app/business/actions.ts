"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentBusinessCookie, currentBusinessCookieOptions, getBusinessSession, requireBusinessOwner } from "@/lib/business-platform/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessOpenOverride } from "@/lib/types";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function businessSignInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/business/login?error=missing-env");
  }

  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");

  if (!email || !password) {
    redirect("/business/login?error=missing-fields");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/business/login?error=invalid-login");
  }

  const session = await getBusinessSession();

  if (!session || session.memberships.length === 0) {
    /* Влязъл е, но не е собственик на нищо: няма какво да види тук. */
    await supabase.auth.signOut();
    redirect("/business/login?error=no-business");
  }

  if (session.memberships.length === 1) {
    const store = await cookies();
    store.set(currentBusinessCookie, session.memberships[0].businessId, currentBusinessCookieOptions());
    redirect("/business");
  }

  redirect("/business/select");
}

export async function businessSignOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  const store = await cookies();
  store.delete({ name: currentBusinessCookie, path: "/business" });

  redirect("/business/login");
}

export async function selectBusinessAction(formData: FormData) {
  const businessId = stringValue(formData, "business_id");
  const session = await getBusinessSession();

  if (!session) {
    redirect("/business/login");
  }

  const membership = session.memberships.find((item) => item.businessId === businessId);

  if (!membership) {
    redirect("/business/select?error=unknown");
  }

  const store = await cookies();
  store.set(currentBusinessCookie, membership.businessId, currentBusinessCookieOptions());
  redirect("/business");
}

const openOverrides: BusinessOpenOverride[] = ["auto", "open", "closed"];

export async function setOpenOverrideAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const value = stringValue(formData, "open_override");

  if (!openOverrides.includes(value as BusinessOpenOverride)) {
    redirect("/business?error=open-override");
  }

  const { error } = await supabase
    .from("business_platform_settings")
    .update({ open_override: value as BusinessOpenOverride })
    .eq("business_id", business.businessId);

  if (error) {
    redirect("/business?error=save");
  }

  revalidatePath("/business");
  redirect("/business?saved=open");
}
