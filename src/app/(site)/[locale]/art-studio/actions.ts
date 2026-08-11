"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getArtStudioProducts, getArtStudioPublicSettings } from "@/lib/art-studio";
import { localePath } from "@/lib/i18n";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, Locale } from "@/lib/types";

function stringValue(formData: FormData, key: string, maxLength = 500) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function orderNumber() {
  return `BN-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function paymentLinkUrl(rawUrl: string, reference: string, email: string, locale: Locale) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.hostname !== "buy.stripe.com") return null;
    url.searchParams.set("client_reference_id", reference);
    url.searchParams.set("prefilled_email", email);
    url.searchParams.set("locale", locale);
    return url.toString();
  } catch {
    return null;
  }
}

function errorPath(locale: Locale, typeSlug: string, productSlug: string, code: string) {
  return `${localePath(locale, `/art-studio/${typeSlug}/${productSlug}`)}?order_error=${code}#order`;
}

export async function createArtStudioOrderAction(formData: FormData) {
  const locale: Locale = stringValue(formData, "locale") === "en" ? "en" : "bg";
  const productId = stringValue(formData, "product_id", 40);
  const offerId = stringValue(formData, "offer_id", 40);
  const typeSlug = stringValue(formData, "type_slug", 100);
  const productSlug = stringValue(formData, "product_slug", 100);

  if (stringValue(formData, "company_website")) {
    redirect(errorPath(locale, typeSlug, productSlug, "invalid"));
  }

  const [products, settings] = await Promise.all([
    getArtStudioProducts({ locale }),
    getArtStudioPublicSettings()
  ]);
  const product = products.find((item) => item.id === productId);
  const offer = product?.offers.find((item) => item.id === offerId && item.is_active);
  if (!settings.orders_enabled || !product || !offer || !offer.payment_link_url) {
    redirect(errorPath(locale, typeSlug, productSlug, "unavailable"));
  }

  const firstName = stringValue(formData, "first_name", 100);
  const lastName = stringValue(formData, "last_name", 100);
  const email = stringValue(formData, "email", 200).toLowerCase();
  const phone = stringValue(formData, "phone", 60);
  const quantity = 1;
  const deliveryMethod = stringValue(formData, "delivery_method") === "econt_office" ? "econt_office" : "gallery_pickup";
  const deliveryCity = stringValue(formData, "delivery_city", 160);
  const deliveryOffice = stringValue(formData, "delivery_office", 240);
  const deliveryNotes = stringValue(formData, "delivery_notes", 1000);
  const personalizationText = product.personalization_text_enabled ? stringValue(formData, "personalization_text", 240) : "";
  const ideaNote = product.idea_note_enabled ? stringValue(formData, "idea_note", 2000) : "";
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!firstName || !lastName || !emailLooksValid || !phone || formData.get("accept_terms") !== "on") {
    redirect(errorPath(locale, typeSlug, productSlug, "required"));
  }
  if (deliveryMethod === "econt_office" && (!deliveryCity || !deliveryOffice)) {
    redirect(errorPath(locale, typeSlug, productSlug, "delivery"));
  }

  const selectedOptions: Record<string, { value: string; label: string }> = {};
  for (const option of product.options) {
    const selectedValue = stringValue(formData, `option_${option.option_key}`, 120);
    const value = option.values.find((item) => item.value === selectedValue);
    if (option.is_required && !value) {
      redirect(errorPath(locale, typeSlug, productSlug, "options"));
    }
    if (value) {
      selectedOptions[option.option_key] = {
        value: value.value,
        label: locale === "en" ? value.label_en || value.label_bg : value.label_bg
      };
    }
  }

  const reference = orderNumber();
  const checkoutUrl = paymentLinkUrl(offer.payment_link_url, reference, email, locale);
  if (!checkoutUrl) redirect(errorPath(locale, typeSlug, productSlug, "payment-link"));

  const unitPrice = Number(offer.price);
  const total = unitPrice;
  const productSnapshot: Json = {
    product_id: product.id,
    title: product.title,
    slug: product.slug,
    product_type: product.product_type.title,
    image_url: product.image_url,
    sku: product.sku,
    offer: {
      id: offer.id,
      label: locale === "en" ? offer.label_en || offer.label_bg : offer.label_bg,
      price: unitPrice,
      currency: offer.currency
    }
  };

  const supabase = createSupabaseAdminClient();
  if (!supabase) redirect(errorPath(locale, typeSlug, productSlug, "server-config"));
  const { error } = await supabase.from("art_studio_orders").insert({
    order_number: reference,
    product_id: product.id,
    offer_id: offer.id,
    product_snapshot: productSnapshot,
    locale,
    customer_first_name: firstName,
    customer_last_name: lastName,
    customer_email: email,
    customer_phone: phone,
    personalization_text: personalizationText || null,
    idea_note: ideaNote || null,
    quantity,
    selected_options: selectedOptions,
    delivery_method: deliveryMethod,
    delivery_city: deliveryMethod === "econt_office" ? deliveryCity : null,
    delivery_office: deliveryMethod === "econt_office" ? deliveryOffice : null,
    delivery_notes: deliveryNotes || null,
    unit_price: unitPrice,
    delivery_price: 0,
    total,
    currency: offer.currency,
    payment_status: "pending",
    production_status: "new",
    payment_link_url: offer.payment_link_url
  });
  if (error) redirect(errorPath(locale, typeSlug, productSlug, "save-failed"));

  redirect(checkoutUrl);
}
