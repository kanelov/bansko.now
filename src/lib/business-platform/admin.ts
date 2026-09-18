import "server-only";
import { isDisplayOnline, listBusinessVideosForAdmin, type AdminBusinessVideo } from "@/lib/business-platform/displays";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessMemberRole, BusinessModuleKey, BusinessPlatformStatus } from "@/lib/types";

/**
 * Каквото админът вижда на /admin/platform: всеки бизнес с настройките на
 * платформата, модулите, собствениците, екраните и видеата. Чете се със
 * сесията на админа (RLS го пуска навсякъде през is_admin()), без service role.
 */

/** Модулите, които вече имат страница в портала. Останалите са в схемата, но не се предлагат. */
export const manageableModules: { key: BusinessModuleKey; label: string; hint: string }[] = [
  { key: "menu", label: "Меню", hint: "категории, артикули, QR меню" },
  { key: "hours", label: "Работно време", hint: "часове и „Отворено сега“" },
  { key: "displays", label: "Екрани", hint: "телевизорите в заведението" },
  { key: "print", label: "Печат", hint: "меню на хартия / PDF" }
];

export const platformStatusOptions: { value: BusinessPlatformStatus; label: string; hint: string }[] = [
  { value: "listing", label: "Само визитка", hint: "профил в каталога, без портал" },
  { value: "active", label: "Активна", hint: "порталът и модулите работят" },
  { value: "suspended", label: "Спряна", hint: "менюто и екраните спират да се показват" }
];

export type PlatformBusiness = {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: string | null;
  platformStatus: BusinessPlatformStatus | null;
  plan: string | null;
  contentVersion: number | null;
  modules: Partial<Record<BusinessModuleKey, boolean>>;
  members: { id: string; userId: string | null; role: BusinessMemberRole; email: string | null; createdAt: string }[];
  displays: { id: string; name: string; token: string; isActive: boolean; online: boolean; lastSeenAt: string | null }[];
  videos: AdminBusinessVideo[];
};

export type PlatformCategoryOption = { id: string; name: string };

/** Категориите на бизнесите (данни, не код) за формата „Нов бизнес“. */
export async function getPlatformCategoryOptions(): Promise<PlatformCategoryOption[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const [{ data: categories }, { data: names }] = await Promise.all([
    supabase.from("business_categories").select("id, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("business_category_translations").select("category_id, name").eq("locale", "bg")
  ]);

  const nameById = new Map((names ?? []).map((row) => [row.category_id, row.name]));
  return (categories ?? []).flatMap((category) => (nameById.has(category.id) ? [{ id: category.id, name: nameById.get(category.id) as string }] : []));
}

export async function getPlatformBusinesses(): Promise<PlatformBusiness[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const [{ data: businesses }, { data: settings }, { data: modules }, { data: members }, { data: displays }, videos] = await Promise.all([
    supabase.from("businesses").select("id, name, slug, status, category").order("name"),
    supabase.from("business_platform_settings").select("business_id, platform_status, plan, content_version"),
    supabase.from("business_modules").select("business_id, module, enabled"),
    supabase.from("business_members").select("id, business_id, user_id, role, invited_email, created_at").order("created_at"),
    supabase.from("business_displays").select("id, business_id, name, token, is_active, last_seen_at").order("created_at"),
    listBusinessVideosForAdmin()
  ]);

  const settingsById = new Map((settings ?? []).map((row) => [row.business_id, row]));

  return (businesses ?? [])
    .map((business) => {
      const platform = settingsById.get(business.id) ?? null;
      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        status: business.status,
        category: business.category ?? null,
        platformStatus: platform?.platform_status ?? null,
        plan: platform?.plan ?? null,
        contentVersion: platform?.content_version ?? null,
        modules: Object.fromEntries((modules ?? []).filter((row) => row.business_id === business.id).map((row) => [row.module, row.enabled])) as Partial<
          Record<BusinessModuleKey, boolean>
        >,
        members: (members ?? [])
          .filter((row) => row.business_id === business.id)
          .map((row) => ({ id: row.id, userId: row.user_id, role: row.role, email: row.invited_email, createdAt: row.created_at })),
        displays: (displays ?? [])
          .filter((row) => row.business_id === business.id)
          .map((row) => ({ id: row.id, name: row.name, token: row.token, isActive: row.is_active, online: isDisplayOnline(row.last_seen_at), lastSeenAt: row.last_seen_at })),
        videos: videos.get(business.id) ?? []
      };
    })
    /* Активните на платформата излизат най-отгоре. */
    .sort((a, b) => Number(b.platformStatus === "active") - Number(a.platformStatus === "active") || a.name.localeCompare(b.name, "bg"));
}
