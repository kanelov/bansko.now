"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getArtStudioProducts, getArtStudioProductTypes, getArtStudioPublicSettings } from "@/lib/art-studio";
import { attachmentMimeTypes, fieldLabel, maxAttachmentBytes, normalizeFormConfig, optionLabel } from "@/lib/art-studio-forms";
import { sendNotificationEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
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

const attachmentBucket = "art-studio-orders";
type SelectedValue = { field: string; value: string; label: string };

function enquiryResult(locale: Locale, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return `${localePath(locale, "/art-studio/order/success")}?${params.toString()}`;
}

function safeFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  const extension = (name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  return `${base}.${extension}`;
}

/**
 * Enquiry-style order: the customer fills in options, contact details and an optional photo;
 * the owner gets an email with everything and confirms price and timing by phone or email.
 * No payment is taken here.
 */
export async function submitArtStudioEnquiryAction(formData: FormData) {
  const locale: Locale = stringValue(formData, "locale") === "en" ? "en" : "bg";
  const isEnglish = locale === "en";
  const productTypeId = stringValue(formData, "product_type_id", 40);
  const productId = stringValue(formData, "product_id", 40);
  const fallbackBack = localePath(locale, "/art-studio");

  if (stringValue(formData, "company_website")) {
    redirect(enquiryResult(locale, { status: "error", code: "invalid", back: fallbackBack }));
  }

  const [types, settings] = await Promise.all([getArtStudioProductTypes({ locale }), getArtStudioPublicSettings()]);
  const productType = types.find((item) => item.id === productTypeId);
  if (!productType) {
    redirect(enquiryResult(locale, { status: "error", code: "unavailable", back: fallbackBack }));
  }

  const typePath = localePath(locale, `/art-studio/${productType.slug}`);
  const products = productId ? await getArtStudioProducts({ locale, productTypeId: productType.id }) : [];
  const product = productId ? products.find((item) => item.id === productId) ?? null : null;
  const backPath = product ? localePath(locale, `/art-studio/${productType.slug}/${product.slug}`) : typePath;
  const fail: (code: string) => never = (code) => redirect(enquiryResult(locale, { status: "error", code, back: backPath }));

  const firstName = stringValue(formData, "first_name", 100);
  const lastName = stringValue(formData, "last_name", 100);
  const email = stringValue(formData, "email", 200).toLowerCase();
  const phone = stringValue(formData, "phone", 60);
  const message = stringValue(formData, "message", 2000);
  const personalizationText = stringValue(formData, "personalization_text", 240);
  const quantityRaw = Number.parseInt(stringValue(formData, "quantity", 3) || "1", 10);
  const quantity = Number.isFinite(quantityRaw) ? Math.min(20, Math.max(1, quantityRaw)) : 1;
  const deliveryMethod = stringValue(formData, "delivery_method") === "econt_office" ? "econt_office" : "gallery_pickup";
  const deliveryCity = stringValue(formData, "delivery_city", 160);
  const deliveryOffice = stringValue(formData, "delivery_office", 240);
  const deliveryNotes = stringValue(formData, "delivery_notes", 1000);
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!firstName || !lastName || !emailLooksValid || !phone || formData.get("accept_terms") !== "on") fail("required");
  if (deliveryMethod === "econt_office" && (!deliveryCity || !deliveryOffice)) fail("delivery");

  const config = normalizeFormConfig(productType.form_config);
  const selected: Record<string, SelectedValue> = {};
  for (const field of config.fields) {
    const chosen = stringValue(formData, `field_${field.key}`, 80);
    const option = field.options.find((item) => item.value === chosen);
    if (field.required && !option) fail("options");
    if (option) selected[field.key] = { field: fieldLabel(field, locale), value: option.value, label: optionLabel(option, locale) };
  }
  for (const option of product?.options ?? []) {
    const chosen = stringValue(formData, `option_${option.option_key}`, 120);
    const value = option.values.find((item) => item.value === chosen);
    if (option.is_required && !value) fail("options");
    if (value) {
      selected[option.option_key] = {
        field: isEnglish ? option.label_en || option.label_bg : option.label_bg,
        value: value.value,
        label: isEnglish ? value.label_en || value.label_bg : value.label_bg
      };
    }
  }

  const offerId = stringValue(formData, "offer_id", 40);
  const offer = product?.offers.find((item) => item.id === offerId && item.is_active) ?? null;
  const unitPrice = offer ? Number(offer.price) : 0;
  const currency = offer?.currency || product?.offers[0]?.currency || "EUR";

  const supabase = createSupabaseAdminClient();
  if (!supabase) fail("server-config");

  const reference = orderNumber();
  const attachment = formData.get("attachment");
  let attachmentPath: string | null = null;
  if (attachment instanceof File && attachment.size > 0) {
    if (attachment.size > maxAttachmentBytes || !attachmentMimeTypes.includes(attachment.type)) fail("attachment");
    const path = `${new Date().toISOString().slice(0, 7)}/${reference}/${safeFileName(attachment.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(attachmentBucket)
      .upload(path, Buffer.from(await attachment.arrayBuffer()), { contentType: attachment.type, upsert: false });
    if (uploadError) fail("attachment");
    attachmentPath = path;
  } else if (config.photo_upload === "required") {
    fail("attachment");
  }

  const productSnapshot: Json = {
    product_type: productType.title,
    product_type_slug: productType.slug,
    product_id: product?.id ?? null,
    title: product?.title ?? productType.title,
    slug: product?.slug ?? null,
    image_url: product?.image_url ?? productType.image_url ?? null,
    sku: product?.sku ?? null,
    request: "enquiry",
    offer: offer ? { id: offer.id, label: isEnglish ? offer.label_en || offer.label_bg : offer.label_bg, price: unitPrice, currency } : null
  };
  const selectedOptions: Json = Object.fromEntries(Object.entries(selected).map(([key, item]) => [key, { value: item.value, label: item.label, field: item.field }]));

  const { error } = await supabase.from("art_studio_orders").insert({
    order_number: reference,
    product_id: product?.id ?? null,
    offer_id: offer?.id ?? null,
    product_snapshot: productSnapshot,
    locale,
    customer_first_name: firstName,
    customer_last_name: lastName,
    customer_email: email,
    customer_phone: phone,
    personalization_text: personalizationText || null,
    idea_note: message || null,
    quantity,
    selected_options: selectedOptions,
    delivery_method: deliveryMethod,
    delivery_city: deliveryMethod === "econt_office" ? deliveryCity : null,
    delivery_office: deliveryMethod === "econt_office" ? deliveryOffice : null,
    delivery_notes: deliveryNotes || null,
    unit_price: unitPrice,
    delivery_price: 0,
    total: unitPrice * quantity,
    currency,
    payment_status: "pending",
    production_status: "new",
    payment_link_url: null,
    request_type: "enquiry",
    attachment_path: attachmentPath
  });
  if (error) fail("save-failed");

  let attachmentUrl: string | null = null;
  if (attachmentPath) {
    const { data: signed } = await supabase.storage.from(attachmentBucket).createSignedUrl(attachmentPath, 60 * 60 * 24 * 7);
    attachmentUrl = signed?.signedUrl ?? null;
  }

  const productLabel = product ? `${productType.title} · ${product.title}` : productType.title;
  const deliveryLabel = deliveryMethod === "econt_office"
    ? (isEnglish ? "Econt office" : "Офис на Еконт")
    : (isEnglish ? "Gallery pickup" : "Взимане от галерията");
  const price = offer ? `${offer.label_bg}${offer.label_en && isEnglish ? ` / ${offer.label_en}` : ""}: ${unitPrice.toFixed(2)} ${currency}` : null;
  const optionRows = Object.values(selected).map((item) => ({ label: item.field, value: item.label }));
  const productUrl = `${siteUrl}${backPath}`;

  await Promise.allSettled([
    sendNotificationEmail({
      subject: `Art Studio поръчка ${reference}: ${productLabel}`,
      title: "Нова поръчка от Art Studio",
      intro: "Клиентът очаква потвърждение на цена, срок и получаване. Отговори на този имейл или се обади.",
      replyTo: email,
      rows: [
        { label: "Номер", value: reference },
        { label: "Продукт", value: productLabel },
        ...optionRows,
        { label: "Количество", value: String(quantity) },
        { label: "Ценови вариант", value: price },
        { label: "Текст / персонализация", value: personalizationText },
        { label: "Съобщение", value: message },
        { label: "Клиент", value: `${firstName} ${lastName}` },
        { label: "Телефон", value: phone },
        { label: "Имейл", value: email },
        { label: "Получаване", value: deliveryLabel },
        { label: "Град", value: deliveryMethod === "econt_office" ? deliveryCity : null },
        { label: "Офис на Еконт", value: deliveryMethod === "econt_office" ? deliveryOffice : null },
        { label: "Бележка за получаване", value: deliveryNotes },
        { label: "Снимка от клиента (линк 7 дни)", value: attachmentUrl },
        { label: "Страница", value: productUrl },
        { label: "Език", value: locale.toUpperCase() }
      ],
      actionUrl: `${siteUrl}/admin/art-studio/orders`,
      actionLabel: "Отвори поръчките"
    }),
    sendNotificationEmail({
      to: email,
      subject: isEnglish ? `We received your Art Studio order (${reference})` : `Получихме поръчката ти в Art Studio Банско (${reference})`,
      title: isEnglish ? "Thank you, we received your order" : "Благодарим, получихме поръчката ти",
      intro: isEnglish
        ? "We will contact you by phone or email to confirm the price, timing and pickup or delivery. No payment is due before that."
        : "Ще се свържем с теб по телефон или имейл, за да потвърдим цената, срока и начина на получаване. Плащане няма преди потвърждението.",
      rows: [
        { label: isEnglish ? "Order number" : "Номер", value: reference },
        { label: isEnglish ? "Product" : "Продукт", value: productLabel },
        ...optionRows,
        { label: isEnglish ? "Quantity" : "Количество", value: String(quantity) },
        { label: isEnglish ? "Pickup / delivery" : "Получаване", value: deliveryLabel },
        { label: isEnglish ? "Your note" : "Твоята бележка", value: message }
      ],
      actionUrl: productUrl,
      actionLabel: isEnglish ? "Back to the product" : "Обратно към продукта"
    })
  ]);

  redirect(enquiryResult(locale, { type: "enquiry", ref: reference, back: backPath }));
}
