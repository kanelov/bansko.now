import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessMemberRole } from "@/lib/types";

/**
 * Кой е влязъл в портала и в кои бизнеси е член.
 *
 * Порталът работи със сървърния клиент с бисквитки, така че всяка заявка към
 * базата минава през RLS: собственикът вижда само своите редове, каквото и да
 * поиска кодът. Проверките тук са втората стена, не единствената.
 */

/** Бисквитката с избрания бизнес: удобство при повече от един, не доказателство. */
export const currentBusinessCookie = "bn_business";

export type BusinessMembership = {
  businessId: string;
  role: BusinessMemberRole;
  name: string;
  slug: string;
};

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type BusinessSession = {
  supabase: ServerClient;
  userId: string;
  memberships: BusinessMembership[];
};

export type OwnerSession = BusinessSession & {
  business: BusinessMembership;
};

export async function getBusinessSession(): Promise<BusinessSession | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = (data as { claims?: { sub?: string } } | null)?.claims;
  const userId = claims?.sub;

  if (error || !userId) {
    return null;
  }

  return { supabase, userId, memberships: await loadMemberships(supabase, userId) };
}

async function loadMemberships(supabase: ServerClient, userId: string): Promise<BusinessMembership[]> {
  const { data: members } = await supabase
    .from("business_members")
    .select("business_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!members || members.length === 0) {
    return [];
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .in(
      "id",
      members.map((member) => member.business_id)
    );

  const byId = new Map((businesses ?? []).map((business) => [business.id, business]));

  return members.flatMap((member) => {
    const business = byId.get(member.business_id);
    return business
      ? [{ businessId: member.business_id, role: member.role, name: business.name, slug: business.slug }]
      : [];
  });
}

/**
 * Пазачът на портала: сесия, членство и избран бизнес, иначе пренасочване.
 * Подава ли се businessId (от форма), той трябва да е сред членствата - така
 * стара бисквитка или подменено поле не водят до чужд бизнес.
 */
export async function requireBusinessOwner(options: { businessId?: string | null } = {}): Promise<OwnerSession> {
  const session = await getBusinessSession();

  if (!session) {
    redirect("/business/login");
  }

  if (session.memberships.length === 0) {
    redirect("/business/login?error=no-business");
  }

  const business = await resolveCurrentBusiness(session.memberships, options.businessId ?? null);

  if (!business) {
    redirect("/business/select");
  }

  /* Служителите са в схемата, но порталът още не ги познава. */
  if (business.role !== "owner") {
    redirect("/business/login?error=not-owner");
  }

  return { ...session, business };
}

async function resolveCurrentBusiness(memberships: BusinessMembership[], requested: string | null) {
  if (requested) {
    return memberships.find((membership) => membership.businessId === requested) ?? null;
  }

  const store = await cookies();
  const selected = store.get(currentBusinessCookie)?.value ?? null;
  const fromCookie = selected ? memberships.find((membership) => membership.businessId === selected) : null;

  if (fromCookie) {
    return fromCookie;
  }

  return memberships.length === 1 ? memberships[0] : null;
}

export function currentBusinessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/business",
    maxAge: 60 * 60 * 24 * 90
  };
}
