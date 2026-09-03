"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/email";
import {
  createGalleryReservation,
  getGalleryProductById
} from "@/lib/gallery-catalog";
import { localizeGalleryProductType } from "@/lib/art-studio-gallery-types";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function stringValue(formData: FormData, key: string, maxLength = 500) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function productPath(locale: Locale, slug: string, query = "") {
  return `${localePath(locale, `/art-studio/gallery/${slug}`)}${query}`;
}

export type GalleryReservationErrorCode = "invalid" | "unavailable" | "required" | "save";

type ReservationOutcome =
  | { ok: true; locale: Locale; slug: string; code: string; fromStock: boolean }
  | { ok: false; locale: Locale; slug: string; code: GalleryReservationErrorCode };

/**
 * The one gallery reservation flow: validates the product and variant against the live gallery
 * data, creates the reservation through the source app API and sends both emails.
 * Used by the gallery product page (redirect) and by the Art Studio design picker (inline state).
 */
async function processGalleryReservation(formData: FormData): Promise<ReservationOutcome> {
  const locale: Locale = stringValue(formData, "locale") === "en" ? "en" : "bg";
  const productId = stringValue(formData, "product_id", 40);
  const fallbackSlug = stringValue(formData, "product_slug", 160);

  if (stringValue(formData, "company_website")) {
    return { ok: false, locale, slug: fallbackSlug, code: "invalid" };
  }

  const product = await getGalleryProductById(productId, locale, { revalidate: 60 });
  if (!product?.can_reserve) {
    return { ok: false, locale, slug: fallbackSlug, code: "unavailable" };
  }

  const variantId = stringValue(formData, "variant_id", 40);
  const variant = product.variants.find((item) => item.id === variantId);
  const customerName = stringValue(formData, "customer_name", 120);
  const customerPhone = stringValue(formData, "customer_phone", 60);
  const customerEmail = stringValue(formData, "customer_email", 180).toLowerCase();
  const note = stringValue(formData, "note", 1200);
  const quantity = Number.parseInt(stringValue(formData, "quantity", 2), 10);
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);

  if (
    !variant
    || !customerName
    || !customerPhone
    || !emailLooksValid
    || !Number.isInteger(quantity)
    || quantity < 1
    || quantity > 20
    || formData.get("accept_terms") !== "on"
  ) {
    return { ok: false, locale, slug: product.slug, code: "required" };
  }

  let reservation;
  try {
    reservation = await createGalleryReservation({
      client_request_id: randomUUID(),
      catalog_id: product.id,
      variant_id: variant.id,
      locale,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      quantity,
      note
    });
  } catch (error) {
    console.error("[gallery reservation failed]", error);
    return { ok: false, locale, slug: product.slug, code: "save" };
  }

  const productTypeName = variant.product_type ? localizeGalleryProductType(variant.product_type.name, locale) : undefined;
  const variantLabel = [productTypeName, variant.label].filter(Boolean).join(" · ");
  const isStockReservation = variant.quantity_available >= quantity;
  await Promise.allSettled([
    sendNotificationEmail({
      to: customerEmail,
      subject: locale === "en"
        ? `Gallery pickup request ${reservation.reservation_code}`
        : `Заявка за галерията ${reservation.reservation_code}`,
      title: locale === "en" ? "Your request was received" : "Заявката ти е получена",
      intro: locale === "en"
        ? "We will confirm the stock or preparation time before pickup. Payment is made at the gallery."
        : "Ще потвърдим наличността или срока за подготовка преди взимане. Плащането е на място в галерията.",
      rows: [
        { label: locale === "en" ? "Number" : "Номер", value: reservation.reservation_code },
        { label: locale === "en" ? "Product" : "Продукт", value: product.title },
        { label: locale === "en" ? "Variant" : "Вариант", value: variantLabel },
        { label: locale === "en" ? "Request" : "Тип заявка", value: isStockReservation ? (locale === "en" ? "Available stock" : "От наличност") : (locale === "en" ? "Made to request" : "По заявка") },
        { label: locale === "en" ? "Quantity" : "Количество", value: String(quantity) }
      ]
    }),
    sendNotificationEmail({
      subject: `Нова Bansko NOW резервация ${reservation.reservation_code}`,
      title: "Нова заявка за взимане от галерията",
      replyTo: customerEmail,
      rows: [
        { label: "Номер", value: reservation.reservation_code },
        { label: "Продукт", value: product.title },
        { label: "SKU", value: product.sku },
        { label: "Вариант", value: variantLabel },
        { label: "Тип заявка", value: isStockReservation ? "От наличност" : "По заявка" },
        { label: "Количество", value: String(quantity) },
        { label: "Клиент", value: customerName },
        { label: "Телефон", value: customerPhone },
        { label: "Email", value: customerEmail },
        { label: "Бележка", value: note }
      ]
    })
  ]);

  return { ok: true, locale, slug: product.slug, code: reservation.reservation_code, fromStock: isStockReservation };
}

/** Gallery product page: full-page form that redirects back to the product with the result. */
export async function createGalleryReservationAction(formData: FormData) {
  const outcome = await processGalleryReservation(formData);
  if (!outcome.ok) {
    redirect(productPath(outcome.locale, outcome.slug, `?reservation_error=${outcome.code}#reserve`));
  }
  redirect(productPath(outcome.locale, outcome.slug, `?reservation=${encodeURIComponent(outcome.code)}#reserve`));
}

export type GalleryReservationState =
  | { status: "idle" }
  | { status: "success"; code: string; fromStock: boolean }
  | { status: "error"; code: GalleryReservationErrorCode };

/** Art Studio design picker: same reservation flow, result returned inline so the customer stays on the page. */
export async function createGalleryReservationInlineAction(_state: GalleryReservationState, formData: FormData): Promise<GalleryReservationState> {
  const outcome = await processGalleryReservation(formData);
  return outcome.ok ? { status: "success", code: outcome.code, fromStock: outcome.fromStock } : { status: "error", code: outcome.code };
}
