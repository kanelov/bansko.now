import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessModuleKey, BusinessPlatformSettings, Database } from "@/lib/types";

/** Какво порталът знае за текущия бизнес: профил, настройки на платформата, модули. */
export type PortalBusiness = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  categoryName: string | null;
  settings: BusinessPlatformSettings | null;
  modules: Partial<Record<BusinessModuleKey, boolean>>;
};

export const moduleLabels: Record<BusinessModuleKey, string> = {
  menu: "Меню",
  hours: "Работно време",
  displays: "Екрани",
  print: "Печат",
  promotions: "Промоции",
  analytics: "Статистика",
  custom_domain: "Собствен домейн"
};

export async function getPortalBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<PortalBusiness | null> {
  const [{ data: business }, { data: settings }, { data: modules }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, address, phone, category, category_id")
      .eq("id", businessId)
      .maybeSingle(),
    supabase.from("business_platform_settings").select("*").eq("business_id", businessId).maybeSingle(),
    supabase.from("business_modules").select("module, enabled").eq("business_id", businessId)
  ]);

  if (!business) {
    return null;
  }

  let categoryName: string | null = business.category || null;

  if (business.category_id) {
    const { data: translation } = await supabase
      .from("business_category_translations")
      .select("name")
      .eq("category_id", business.category_id)
      .eq("locale", "bg")
      .maybeSingle();

    if (translation?.name) {
      categoryName = translation.name;
    }
  }

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    address: business.address,
    phone: business.phone ?? null,
    categoryName,
    settings: settings ?? null,
    modules: Object.fromEntries((modules ?? []).map((row) => [row.module, row.enabled])) as Partial<
      Record<BusinessModuleKey, boolean>
    >
  };
}
