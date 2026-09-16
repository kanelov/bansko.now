import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateLocalePath } from "@/lib/articles-admin";
import type { Database } from "@/lib/types";

/**
 * След всеки запис в портала публичните страници на бизнеса се пресъздават:
 * профилът и QR менюто на всеки език. Телевизорите не са тук - те гледат
 * content_version и се презареждат сами.
 */
export async function revalidateBusinessPublic(supabase: SupabaseClient<Database>, businessId: string) {
  const { data: translations } = await supabase.from("business_translations").select("locale, slug").eq("business_id", businessId);

  for (const translation of translations ?? []) {
    revalidateLocalePath(translation.locale, `/places/${translation.slug}`);
    revalidateLocalePath(translation.locale, `/places/${translation.slug}/menu`);
  }

  revalidateLocalePath("bg", "/places");
  revalidateLocalePath("en", "/places");
}
