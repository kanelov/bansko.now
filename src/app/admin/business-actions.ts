"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/supabase/auth";
import type { BusinessPaymentStatus, BusinessStatus, BusinessTier } from "@/lib/types";

const businessImagesBucket = "business-images";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rawStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function integerValue(formData: FormData, key: string, fallback = 0) {
  const value = stringValue(formData, key);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  const parsed = value ? Number.parseFloat(value.replace(",", ".")) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function uuidValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function linesValue(formData: FormData, key: string) {
  return rawStringValue(formData, key)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeDate(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

function businessTierValue(value: string | null): BusinessTier {
  return value === "featured" || value === "premium" || value === "homepage" ? value : "free";
}

function businessStatusValue(value: string | null): BusinessStatus {
  return value === "approved" || value === "rejected" ? value : "draft";
}

function businessPaymentStatusValue(value: string | null): BusinessPaymentStatus {
  return value === "pending" || value === "paid" || value === "expired" ? value : "unpaid";
}

function contactMessageStatusValue(value: string | null): "new" | "read" | "archived" {
  return value === "new" || value === "archived" ? value : "read";
}

function revalidateBusinessPaths() {
  revalidatePath("/");
  revalidatePath("/businesses");
  revalidatePath("/businesses/map");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/businesses");
}

function storagePathFromBusinessUrl(fileUrl: string | null) {
  if (!fileUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${businessImagesBucket}/`;

  try {
    const parsed = new URL(fileUrl);
    const markerIndex = parsed.pathname.indexOf(marker);
    return markerIndex >= 0 ? decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length)) : null;
  } catch {
    const markerIndex = fileUrl.indexOf(marker);
    const rawPath = markerIndex >= 0 ? fileUrl.slice(markerIndex + marker.length).split("?")[0] : null;
    return rawPath ? decodeURIComponent(rawPath) : null;
  }
}

export async function upsertBusinessPlanAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const name = stringValue(formData, "name") || "Нов план";
  const payload = {
    name,
    slug: stringValue(formData, "slug") || `${slugify(name) || "plan"}-${randomUUID().slice(0, 6)}`,
    tier: businessTierValue(stringValue(formData, "tier")),
    period_months: integerValue(formData, "period_months", 1),
    price: numberValue(formData, "price"),
    currency: stringValue(formData, "currency") || "BGN",
    stripe_payment_link: stringValue(formData, "stripe_payment_link"),
    description: stringValue(formData, "description"),
    benefits: linesValue(formData, "benefits_input"),
    is_active: booleanValue(formData, "is_active"),
    sort_order: integerValue(formData, "sort_order", 100)
  };

  if (id) {
    await supabase.from("business_listing_plans").update(payload).eq("id", id);
  } else {
    await supabase.from("business_listing_plans").insert(payload);
  }

  revalidateBusinessPaths();
}

export async function saveBusinessDirectorySettingsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const payload = {
    intro_title: stringValue(formData, "intro_title"),
    intro_description: stringValue(formData, "intro_description"),
    premium_offer_title: stringValue(formData, "premium_offer_title"),
    premium_offer_description: stringValue(formData, "premium_offer_description"),
    map_image_url: stringValue(formData, "map_image_url"),
    map_image_alt: stringValue(formData, "map_image_alt"),
    notification_email: stringValue(formData, "notification_email"),
    about_title: stringValue(formData, "about_title"),
    about_eyebrow: stringValue(formData, "about_eyebrow"),
    about_description: stringValue(formData, "about_description"),
    about_body: rawStringValue(formData, "about_body"),
    about_image_url: stringValue(formData, "about_image_url"),
    contact_title: stringValue(formData, "contact_title"),
    contact_description: stringValue(formData, "contact_description")
  };

  if (id) {
    await supabase.from("business_directory_settings").update(payload).eq("id", id);
  } else {
    await supabase.from("business_directory_settings").insert(payload);
  }

  revalidatePath("/about");
  revalidatePath("/contact");
  revalidateBusinessPaths();
}

export async function updateBusinessAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/businesses?error=missing-id");
  }

  const name = stringValue(formData, "name") || "Business";
  const activePlanId = uuidValue(formData, "active_plan_id");
  const payload = {
    name,
    slug: stringValue(formData, "slug") || slugify(name),
    category: stringValue(formData, "category") || "Услуги",
    description: stringValue(formData, "description"),
    address: stringValue(formData, "address") || "Банско",
    latitude: numberValue(formData, "latitude"),
    longitude: numberValue(formData, "longitude"),
    video_link: stringValue(formData, "video_link"),
    website_url: stringValue(formData, "website_url"),
    instagram_url: stringValue(formData, "instagram_url"),
    facebook_url: stringValue(formData, "facebook_url"),
    features: linesValue(formData, "features_input"),
    requested_services: linesValue(formData, "requested_services_input"),
    status: businessStatusValue(stringValue(formData, "status")),
    listing_tier: businessTierValue(stringValue(formData, "listing_tier")),
    active_plan_id: activePlanId,
    payment_status: businessPaymentStatusValue(stringValue(formData, "payment_status")),
    paid_until: normalizeDate(stringValue(formData, "paid_until")),
    is_homepage_spotlight: booleanValue(formData, "is_homepage_spotlight"),
    homepage_spotlight_until: normalizeDate(stringValue(formData, "homepage_spotlight_until")),
    priority: integerValue(formData, "priority", 100),
    map_pin_x: numberValue(formData, "map_pin_x"),
    map_pin_y: numberValue(formData, "map_pin_y"),
    show_on_illustrated_map: booleanValue(formData, "show_on_illustrated_map"),
    admin_notes: stringValue(formData, "admin_notes"),
    seo_title: stringValue(formData, "seo_title"),
    seo_description: stringValue(formData, "seo_description")
  };

  const { error } = await supabase.from("businesses").update(payload).eq("id", id);

  if (error) {
    redirect(`/admin/businesses?error=${encodeURIComponent(error.message)}`);
  }

  revalidateBusinessPaths();
  revalidatePath(`/businesses/${payload.slug}`);
  redirect("/admin/businesses?saved=1");
}

export async function approveBusinessAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/businesses?error=missing-id");
  }

  await supabase.from("businesses").update({ status: "approved" }).eq("id", id);
  revalidateBusinessPaths();
  redirect("/admin/businesses?approved=1");
}

export async function deleteBusinessAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/businesses?error=missing-id");
  }

  const { data: business } = await supabase.from("businesses").select("images").eq("id", id).maybeSingle();
  const imageUrls = Array.isArray(business?.images) ? business.images : [];
  const paths = imageUrls.map((url) => storagePathFromBusinessUrl(url)).filter(Boolean) as string[];

  if (paths.length) {
    await supabase.storage.from(businessImagesBucket).remove(paths);
  }

  await supabase.from("businesses").delete().eq("id", id);
  revalidateBusinessPaths();
  redirect("/admin/businesses?deleted=1");
}

export async function markContactMessageAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const status = contactMessageStatusValue(stringValue(formData, "status"));

  if (!id) {
    redirect("/admin/businesses?error=missing-id#messages");
  }

  await supabase.from("contact_messages").update({ status }).eq("id", id);
  revalidatePath("/admin/businesses");
}

export async function sendBusinessPaidNotificationAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");

  if (!id) {
    redirect("/admin/businesses?error=missing-id");
  }

  const { data } = await supabase
    .from("businesses")
    .select("name, listing_tier, paid_until, business_contacts(owner_email, owner_name)")
    .eq("id", id)
    .maybeSingle();
  const business = data as unknown as { name: string | null; listing_tier: string | null; paid_until: string | null } | null;

  await sendNotificationEmail({
    subject: "Bansko NOW: бизнесът е маркиран като платен",
    title: "Платен бизнес листинг",
    rows: [
      { label: "Бизнес", value: business?.name },
      { label: "Ниво", value: business?.listing_tier },
      { label: "Активен до", value: business?.paid_until }
    ],
    actionUrl: `${siteUrl}/admin/businesses`,
    actionLabel: "Към admin"
  });
}
