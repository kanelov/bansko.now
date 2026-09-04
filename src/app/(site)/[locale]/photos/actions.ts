"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { localePath } from "@/lib/i18n";
import { getPhotoBySlug, getPhotoLicenseTypes, photoLicensePrice } from "@/lib/photos";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/types";

function value(formData: FormData, key: string, maxLength = 300) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

/**
 * Starts a license purchase: the price and the license text always come from the database,
 * never from the browser. Creates a pending order, freezes the terms and hands the customer
 * to Stripe Checkout.
 */
export async function createPhotoLicenseCheckoutAction(formData: FormData) {
  const locale: Locale = value(formData, "locale", 5) === "en" ? "en" : "bg";
  const slug = value(formData, "slug", 160);
  const licenseCode = value(formData, "license_code", 40);
  const back = localePath(locale, `/photos/${slug}/license`);
  const fail = (code: string): never => redirect(`${back}?error=${encodeURIComponent(code)}`);

  if (value(formData, "company_website")) fail("invalid");

  const photo = await getPhotoBySlug(slug, locale);
  if (!photo || !photo.licensing_enabled) return fail("unavailable");

  const licenses = await getPhotoLicenseTypes();
  const license = licenses.find((item) => item.code === licenseCode);
  if (!license) return fail("unavailable");

  const email = value(formData, "customer_email", 180).toLowerCase();
  const name = value(formData, "customer_name", 120);
  const company = value(formData, "company_name", 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || formData.get("accept_terms") !== "on") fail("required");

  const stripe = getStripeClient();
  const supabase = createSupabaseAdminClient();
  if (!stripe || !supabase) return fail("server-config");

  const amount = photoLicensePrice(photo, license);
  const terms = locale === "en" ? license.terms_en : license.terms_bg;

  const { data: order, error } = await supabase
    .from("photo_license_orders")
    .insert({
      photo_id: photo.id,
      license_type_id: license.id,
      license_code: license.code,
      license_version: license.terms_version,
      license_terms_snapshot: terms,
      locale,
      customer_email: email,
      customer_name: name,
      company_name: company || null,
      amount,
      currency: "EUR",
      status: "pending"
    })
    .select("id,order_code")
    .single();
  if (error || !order) return fail("save-failed");

  const licenseName = locale === "en" ? license.name_en : license.name_bg;
  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: order.order_code,
      metadata: { order_id: order.id, order_code: order.order_code, photo_code: photo.photo_code, license_code: license.code },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${photo.title} · ${licenseName}`,
              description: `${photo.photo_code} · ${locale === "en" ? "Photograph by Lubo Kanelov" : "Фотография от Лубо Кънелов"}`,
              images: photo.thumb_url ? [photo.thumb_url] : undefined
            }
          }
        }
      ],
      success_url: `${siteUrl}${localePath(locale, "/photos/license/success")}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${back}?error=cancelled`
    });
    checkoutUrl = session.url;
    await supabase.from("photo_license_orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
  } catch (stripeError) {
    console.error("[photo license checkout failed]", stripeError);
    fail("payment");
  }

  if (!checkoutUrl) return fail("payment");
  redirect(checkoutUrl);
}
