import type { Metadata } from "next";
import "@/styles/menu-paper.css";
import { BrandingForm } from "@/components/business/branding-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { listDisplays } from "@/lib/business-platform/displays";
import { getMenuCategoryOptions } from "@/lib/business-platform/menu";
import { getBusinessTheme } from "@/lib/business-platform/theme";

export const metadata: Metadata = {
  title: "Бранд"
};

/**
 * Брандът на бизнеса: една тема за QR менюто, телевизорите и печата.
 * menu-paper.css се зарежда тук, за да са картите на темите истинско парче
 * меню (същите класове като на телевизора), а не картинка.
 */
export default async function BusinessBrandingPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const [{ theme, logo }, displays, categories, { data: settings }] = await Promise.all([
    getBusinessTheme(supabase, business.businessId),
    listDisplays(supabase, business.businessId),
    getMenuCategoryOptions(supabase, business.businessId),
    supabase.from("business_platform_settings").select("content_version").eq("business_id", business.businessId).maybeSingle()
  ]);

  const firstDisplay = displays.find((display) => display.is_active) ?? null;
  const sampleCategory = categories.find((category) => category.isActive)?.name ?? "Топли напитки";

  return (
    <BrandingForm
      businessId={business.businessId}
      businessName={business.name}
      qrPath={`/places/${business.slug}/menu`}
      theme={theme}
      logo={logo}
      sampleCategory={sampleCategory}
      preview={firstDisplay ? { token: firstDisplay.token, refreshKey: `${settings?.content_version ?? 0}-${saved ?? ""}` } : null}
      saved={saved}
      error={error}
    />
  );
}
