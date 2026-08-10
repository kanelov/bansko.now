import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { localePath } from "@/lib/i18n";
import type {
  Business,
  BusinessDirectorySettings,
  BusinessFaq,
  BusinessListingPlan,
  BusinessTranslation,
  BusinessTier,
  BusinessWithRelations,
  ContactMessage,
  Locale
} from "@/lib/types";

export const businessCategories = [
  "Ресторанти",
  "Кафета",
  "Хотели",
  "Къщи за гости",
  "Услуги",
  "Магазини",
  "Активности",
  "Здраве и спорт",
  "Транспорт",
  "Култура"
];

export const businessFeatures = [
  "Wi-Fi",
  "Паркинг",
  "Плащане с карта",
  "Pet friendly",
  "Подходящо за семейства",
  "Доставка",
  "Работи целогодишно",
  "Английски език",
  "Тераса",
  "Достъпно за колички"
];

export const businessServices = [
  "Професионално заснемане",
  "Видео представяне",
  "Дрон кадри",
  "Дизайн и визуална идентичност",
  "Искам индивидуална оферта"
];

export const fallbackBusinessDirectorySettings: BusinessDirectorySettings = {
  id: "fallback",
  intro_title: "Местни бизнеси в Банско",
  intro_description: "Открий места, услуги и локални партньори в Банско.",
  premium_offer_title: "Искаш по-видимо представяне?",
  premium_offer_description:
    "Безплатното присъствие е по подразбиране. При желание избери годишно ниво за по-силна видимост в Bansko NOW.",
  map_image_url: null,
  map_image_alt: "Илюстрирана карта на Банско",
  notification_email: null,
  about_title: "Bansko NOW",
  about_eyebrow: "За проекта",
  about_description:
    "Bansko NOW е местна дигитална платформа за събития, култура, природа, хора и ежедневен живот в Банско.",
  about_body:
    "Създаваме чисто, полезно и красиво място за откриване на Банско - от истории и събития до местни бизнеси и визуални проекти.",
  about_image_url: null,
  contact_title: "Пиши на Bansko NOW",
  contact_description: "За събития, препоръки, бизнеси, партньорства и визуални проекти."
};

export function normalizeBusiness(business: BusinessWithRelations): BusinessWithRelations {
  const contact = business.contact ?? business.business_contacts?.[0] ?? null;

  return {
    ...business,
    contact,
    business_contacts: business.business_contacts ?? (contact ? [contact] : [])
  };
}

export function isPaidTierActive(business: Pick<Business, "listing_tier" | "paid_until" | "payment_status">) {
  return (
    business.payment_status === "paid" &&
    business.listing_tier !== "free" &&
    Boolean(business.paid_until) &&
    new Date(business.paid_until as string).getTime() > Date.now()
  );
}

export function getEffectiveBusinessTier(business: Pick<Business, "listing_tier" | "paid_until" | "payment_status">): BusinessTier {
  return isPaidTierActive(business) ? business.listing_tier : "free";
}

export function getBusinessPath(business: Pick<Business, "slug">, locale: Locale = "bg") {
  return localePath(locale, `/businesses/${business.slug}`);
}

export function getDirectionsUrl(business: Pick<Business, "latitude" | "longitude" | "address" | "name">) {
  if (typeof business.latitude === "number" && typeof business.longitude === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
  }

  const query = encodeURIComponent(`${business.name}, ${business.address}, Bansko`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function parseBusinessFaqs(value: unknown): BusinessFaq[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const record = item as Record<string, unknown>;
          const question = typeof record.question === "string" ? record.question : "";
          const answer = typeof record.answer === "string" ? record.answer : "";

          return question && answer ? { question, answer } : null;
        })
        .filter(Boolean) as BusinessFaq[]
    : [];
}

export async function getBusinessDirectorySettings(locale: Locale = "bg"): Promise<BusinessDirectorySettings> {
  const supabase = createPublicSupabaseClient();
  const localize = (settings: BusinessDirectorySettings): BusinessDirectorySettings =>
    locale === "en"
      ? {
          ...settings,
          intro_title: "Local businesses in Bansko",
          intro_description: "Discover places, services and local partners in Bansko.",
          premium_offer_title: "Want a more visible listing?",
          premium_offer_description: "A free listing is the default. Choose an annual plan for stronger visibility in Bansko NOW.",
          map_image_alt: "Illustrated map of Bansko",
          about_eyebrow: "About",
          about_title: "Bansko NOW",
          about_description: "A local digital platform for events, culture, nature, people and everyday life in Bansko.",
          contact_title: "Contact Bansko NOW",
          contact_description: "For events, recommendations, businesses, partnerships and visual projects."
        }
      : settings;

  if (!supabase) {
    return localize(fallbackBusinessDirectorySettings);
  }

  const { data, error } = await supabase.from("business_directory_settings").select("*").limit(1).maybeSingle();

  if (error || !data) {
    return localize(fallbackBusinessDirectorySettings);
  }

  return localize(data as BusinessDirectorySettings);
}

export async function getBusinessListingPlans(options?: { includeInactive?: boolean }): Promise<BusinessListingPlan[]> {
  const supabase = options?.includeInactive ? await createSupabaseServerClient() : createPublicSupabaseClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("business_listing_plans")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("period_months", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data } = await query;
  return (data ?? []) as BusinessListingPlan[];
}

function localizeBusiness(business: BusinessWithRelations, translation: BusinessTranslation): BusinessWithRelations {
  return {
    ...business,
    slug: translation.slug,
    name: translation.name,
    category: translation.category,
    description: translation.description,
    address: translation.address,
    faqs: translation.faqs,
    features: translation.features,
    seo_title: translation.seo_title,
    seo_description: translation.seo_description,
    canonical_url: translation.canonical_url,
    og_title: translation.og_title,
    og_description: translation.og_description,
    og_image_url: translation.og_image_url,
    robots_index: translation.robots_index,
    robots_follow: translation.robots_follow,
    schema_type: translation.schema_type
  };
}

export async function getApprovedBusinesses(locale: Locale = "bg"): Promise<BusinessWithRelations[]> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("businesses")
    .select("*, requested_plan:business_listing_plans!businesses_requested_plan_id_fkey(*), active_plan:business_listing_plans!businesses_active_plan_id_fkey(*)")
    .eq("status", "approved")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  const businesses = ((data ?? []) as unknown as BusinessWithRelations[]).map(normalizeBusiness);

  if (!businesses.length) {
    return [];
  }

  const { data: translations } = await supabase
    .from("business_translations")
    .select("*")
    .eq("locale", locale)
    .in("business_id", businesses.map((business) => business.id));
  const byId = new Map((translations ?? []).map((translation) => [translation.business_id, translation]));

  return businesses
    .flatMap((business) => {
      const translation = byId.get(business.id);
      return translation ? [localizeBusiness(business, translation)] : [];
    })
    .sort(compareBusinesses);
}

export async function getHomepageSpotlightBusiness(locale: Locale = "bg") {
  const businesses = await getApprovedBusinesses(locale);

  return businesses.find((business) => {
    const tier = getEffectiveBusinessTier(business);
    const spotlightDate = business.homepage_spotlight_until ? new Date(business.homepage_spotlight_until).getTime() : 0;

    return business.is_homepage_spotlight && spotlightDate > Date.now() && (tier === "homepage" || tier === "premium");
  }) ?? businesses.find((business) => getEffectiveBusinessTier(business) === "premium") ?? null;
}

export async function getBusinessBySlug(slug: string, locale: Locale = "bg") {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: translation } = await supabase
    .from("business_translations")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();

  if (!translation) {
    return null;
  }

  const { data } = await supabase
    .from("businesses")
    .select("*, requested_plan:business_listing_plans!businesses_requested_plan_id_fkey(*), active_plan:business_listing_plans!businesses_active_plan_id_fkey(*)")
    .eq("id", translation.business_id)
    .eq("status", "approved")
    .maybeSingle();

  return data ? localizeBusiness(normalizeBusiness(data as unknown as BusinessWithRelations), translation) : null;
}

export async function getApprovedBusinessTranslation(businessId: string, locale: Locale) {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: translation } = await supabase
    .from("business_translations")
    .select("*")
    .eq("business_id", businessId)
    .eq("locale", locale)
    .maybeSingle();

  if (!translation) {
    return null;
  }

  const { data } = await supabase
    .from("businesses")
    .select("*, requested_plan:business_listing_plans!businesses_requested_plan_id_fkey(*), active_plan:business_listing_plans!businesses_active_plan_id_fkey(*)")
    .eq("id", businessId)
    .eq("status", "approved")
    .maybeSingle();

  return data ? localizeBusiness(normalizeBusiness(data as unknown as BusinessWithRelations), translation as BusinessTranslation) : null;
}

export async function getAdminBusinesses(): Promise<BusinessWithRelations[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("businesses")
    .select("*, business_contacts(*), requested_plan:business_listing_plans!businesses_requested_plan_id_fkey(*), active_plan:business_listing_plans!businesses_active_plan_id_fkey(*)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as BusinessWithRelations[]).map(normalizeBusiness);
}

export async function getAdminBusinessTranslations(): Promise<BusinessTranslation[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("business_translations")
    .select("*")
    .order("locale");

  return (data ?? []) as BusinessTranslation[];
}

export async function getContactMessages(limit = 20): Promise<ContactMessage[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ContactMessage[];
}

function compareBusinesses(a: BusinessWithRelations, b: BusinessWithRelations) {
  const weight: Record<BusinessTier, number> = {
    homepage: 0,
    premium: 1,
    free: 2
  };
  const tierA = getEffectiveBusinessTier(a);
  const tierB = getEffectiveBusinessTier(b);

  if (weight[tierA] !== weight[tierB]) {
    return weight[tierA] - weight[tierB];
  }

  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
