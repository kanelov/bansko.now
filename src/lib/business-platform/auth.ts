import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/supabase/auth";
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
  /** Админът на Bansko NOW гледа портала на чужд бизнес (поддръжка), без да е негов собственик. */
  viaAdmin?: boolean;
};

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type BusinessSession = {
  supabase: ServerClient;
  userId: string;
  /** Акаунтът е админ на Bansko NOW: един и същ вход (и парола) за админа и за портала. */
  isAdmin: boolean;
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

  const isAdmin = hasAdminRole(claims);
  const memberships = await loadMemberships(supabase, userId);

  return { supabase, userId, isAdmin, memberships: isAdmin ? await withPlatformBusinesses(supabase, memberships) : memberships };
}

/**
 * Админът вижда портала на всеки бизнес, който е на платформата - за да помогне
 * на собственик или да провери нещо, без да се добавя като собственик навсякъде.
 * RLS и пазачите на колони така или иначе го пускат през is_admin().
 */
async function withPlatformBusinesses(supabase: ServerClient, memberships: BusinessMembership[]): Promise<BusinessMembership[]> {
  const { data: settings } = await supabase.from("business_platform_settings").select("business_id");
  const known = new Set(memberships.map((membership) => membership.businessId));
  const missing = (settings ?? []).map((row) => row.business_id).filter((id) => !known.has(id));

  if (missing.length === 0) {
    return memberships;
  }

  const { data: businesses } = await supabase.from("businesses").select("id, name, slug").in("id", missing).order("name");

  return [
    ...memberships,
    ...(businesses ?? []).map((business) => ({
      businessId: business.id,
      role: "owner" as const,
      name: business.name,
      slug: business.slug,
      viaAdmin: true
    }))
  ];
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
