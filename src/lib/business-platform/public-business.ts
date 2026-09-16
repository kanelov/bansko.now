import "server-only";
import { revalidateLocalePath } from "@/lib/articles-admin";
import { getBusinessHours, resolveOpenState, type BusinessHours, type OpenState } from "@/lib/business-platform/hours";
import { getBusinessMenu, type BusinessMenu } from "@/lib/business-platform/menu";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { BusinessOpenOverride, Database, Locale } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Каквото публичните страници знаят за платформата на един бизнес.
 *
 * Тук няма проверка „включен ли е модулът“: политиките в базата вече пускат
 * меню и часове само на бизнес с включен модул, така че празен резултат значи
 * изключен модул. Едно правило, на едно място - в RLS.
 */

export type PublicBusinessPlatform = {
  menu: BusinessMenu;
  hasMenu: boolean;
  hours: BusinessHours;
  hasHours: boolean;
  openState: OpenState;
};

export async function getPublicBusinessPlatform(businessId: string, locale: Locale): Promise<PublicBusinessPlatform | null> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const [menu, hours, { data: settings }] = await Promise.all([
    getBusinessMenu(supabase, businessId, { locale }),
    getBusinessHours(supabase, businessId),
    supabase.from("business_platform_settings").select("open_override").eq("business_id", businessId).maybeSingle()
  ]);

  const override = (settings?.open_override ?? "auto") as BusinessOpenOverride;
  const hasMenu = menu.categories.some((category) => category.items.length > 0);
  const hasHours = hours.week.some((day) => day.intervals.length > 0);

  return {
    menu,
    hasMenu,
    hours,
    hasHours,
    openState: hasHours || override !== "auto" ? resolveOpenState(hours, override) : { state: "unknown" }
  };
}

/**
 * Кои бизнеси имат публично меню - за картата на сайта и за връзките към QR
 * менюто. Политиките вече спират скритото, затова тук няма втора проверка.
 */
export async function getBusinessIdsWithPublicMenu(): Promise<Set<string>> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return new Set();
  }

  const { data } = await supabase.from("business_menu_items").select("business_id").limit(2000);
  return new Set((data ?? []).map((row) => row.business_id));
}

/**
 * Промяна в портала стига до профила и QR менюто веднага, а не след 15 минути.
 * Адресът е различен на двата езика, затова се чете от преводите.
 */
export async function revalidateBusinessPublicPages(supabase: SupabaseClient<Database>, businessId: string) {
  const { data } = await supabase.from("business_translations").select("locale, slug").eq("business_id", businessId);

  for (const row of data ?? []) {
    const locale = row.locale as Locale;
    revalidateLocalePath(locale, `/places/${row.slug}`);
    revalidateLocalePath(locale, `/places/${row.slug}/menu`);
  }
}
