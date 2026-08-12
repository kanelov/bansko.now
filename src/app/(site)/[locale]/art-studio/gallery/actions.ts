"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/email";
import {
  createGalleryReservation,
  getGalleryProductById
} from "@/lib/gallery-catalog";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function stringValue(formData: FormData, key: string, maxLength = 500) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function productPath(locale: Locale, slug: string, query = "") {
  return `${localePath(locale, `/art-studio/gallery/${slug}`)}${query}`;
}

export async function createGalleryReservationAction(formData: FormData) {
  const locale: Locale = stringValue(formData, "locale") === "en" ? "en" : "bg";
  const productId = stringValue(formData, "product_id", 40);
  const fallbackSlug = stringValue(formData, "product_slug", 160);

  if (stringValue(formData, "company_website")) {
    redirect(productPath(locale, fallbackSlug, "?reservation_error=invalid#reserve"));
  }

  const product = await getGalleryProductById(productId, locale);
  if (!product?.can_reserve) {
    redirect(productPath(locale, fallbackSlug, "?reservation_error=unavailable#reserve"));
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
    || quantity > Math.min(20, variant.quantity_available)
    || formData.get("accept_terms") !== "on"
  ) {
    redirect(productPath(locale, product.slug, "?reservation_error=required#reserve"));
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
    redirect(productPath(locale, product.slug, "?reservation_error=save#reserve"));
  }

  const variantLabel = [variant.product_type?.name, variant.label].filter(Boolean).join(" · ");
  await Promise.allSettled([
    sendNotificationEmail({
      to: customerEmail,
      subject: locale === "en"
        ? `Gallery pickup request ${reservation.reservation_code}`
        : `Заявка за галерията ${reservation.reservation_code}`,
      title: locale === "en" ? "Your request was received" : "Заявката ти е получена",
      intro: locale === "en"
        ? "We will confirm availability before pickup. Payment is made at the gallery."
        : "Ще потвърдим наличността преди взимане. Плащането е на място в галерията.",
      rows: [
        { label: locale === "en" ? "Number" : "Номер", value: reservation.reservation_code },
        { label: locale === "en" ? "Product" : "Продукт", value: product.title },
        { label: locale === "en" ? "Variant" : "Вариант", value: variantLabel },
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
        { label: "Количество", value: String(quantity) },
        { label: "Клиент", value: customerName },
        { label: "Телефон", value: customerPhone },
        { label: "Email", value: customerEmail },
        { label: "Бележка", value: note }
      ]
    })
  ]);

  redirect(productPath(locale, product.slug, `?reservation=${encodeURIComponent(reservation.reservation_code)}#reserve`));
}
