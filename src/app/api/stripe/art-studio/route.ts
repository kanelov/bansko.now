import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendNotificationEmail } from "@/lib/email";
import { siteUrl, stripeWebhookSecret } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ArtStudioOrder } from "@/lib/types";

export const runtime = "nodejs";

const zeroDecimalCurrencies = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);

function expectedMinorAmount(total: number, currency: string) {
  return Math.round(total * (zeroDecimalCurrencies.has(currency.toLowerCase()) ? 1 : 100));
}

function paymentLinkId(session: Stripe.Checkout.Session) {
  if (!session.payment_link) return null;
  return typeof session.payment_link === "string" ? session.payment_link : session.payment_link.id;
}

function productTitle(order: ArtStudioOrder) {
  const snapshot = order.product_snapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return "Art Studio продукт";
  return typeof snapshot.title === "string" ? snapshot.title : "Art Studio продукт";
}

function selectedOptions(order: ArtStudioOrder) {
  const selected = order.selected_options;
  if (!selected || typeof selected !== "object" || Array.isArray(selected)) return null;
  const labels = Object.values(selected).flatMap((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return typeof value.label === "string" ? [value.label] : [];
  });
  return labels.length ? labels.join(", ") : null;
}

function deliveryLabel(order: ArtStudioOrder) {
  if (order.delivery_method === "gallery_pickup") return order.locale === "en" ? "Gallery pickup" : "Взимане от галерията";
  return [order.locale === "en" ? "Econt office" : "Офис на Еконт", order.delivery_city, order.delivery_office].filter(Boolean).join(" · ");
}

async function notifyPaidOrder(order: ArtStudioOrder) {
  const title = productTitle(order);
  const amount = `${Number(order.total).toFixed(2)} ${order.currency.toUpperCase()}`;
  const adminEmail = sendNotificationEmail({
    subject: `Bansko NOW: платена поръчка ${order.order_number}`,
    title: "Нова платена Art Studio поръчка",
    replyTo: order.customer_email,
    rows: [
      { label: "Поръчка", value: order.order_number },
      { label: "Продукт", value: title },
      { label: "Опции", value: selectedOptions(order) },
      { label: "Име / текст", value: order.personalization_text },
      { label: "Идея / бележка", value: order.idea_note },
      { label: "Клиент", value: `${order.customer_first_name} ${order.customer_last_name}` },
      { label: "Имейл", value: order.customer_email },
      { label: "Телефон", value: order.customer_phone },
      { label: "Получаване", value: deliveryLabel(order) },
      { label: "Платено", value: amount }
    ],
    actionUrl: `${siteUrl}/admin/art-studio/orders`,
    actionLabel: "Към поръчките"
  });
  const isEnglish = order.locale === "en";
  const customerEmail = sendNotificationEmail({
    to: order.customer_email,
    subject: isEnglish ? `Order confirmed ${order.order_number}` : `Потвърдена поръчка ${order.order_number}`,
    title: isEnglish ? "Your Art Studio order is confirmed" : "Твоята Art Studio поръчка е потвърдена",
    intro: isEnglish ? "We received your payment and will contact you if we need any additional details." : "Получихме плащането и ще се свържем с теб, ако са нужни допълнителни детайли.",
    rows: [
      { label: isEnglish ? "Order" : "Поръчка", value: order.order_number },
      { label: isEnglish ? "Product" : "Продукт", value: title },
      { label: isEnglish ? "Options" : "Опции", value: selectedOptions(order) },
      { label: isEnglish ? "Collection / delivery" : "Получаване", value: deliveryLabel(order) },
      { label: isEnglish ? "Paid" : "Платено", value: amount }
    ],
    actionUrl: `${siteUrl}${order.locale === "en" ? "/en" : ""}/art-studio`,
    actionLabel: isEnglish ? "Open Art Studio" : "Към Art Studio"
  });
  await Promise.allSettled([adminEmail, customerEmail]);
}

async function completeOrder(session: Stripe.Checkout.Session) {
  const reference = session.client_reference_id;
  if (!reference || session.mode !== "payment" || (session.payment_status !== "paid" && session.payment_status !== "no_payment_required")) return;

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured");
  const { data, error } = await supabase.from("art_studio_orders").select("*").eq("order_number", reference).maybeSingle();
  if (error) throw error;
  if (!data || data.payment_status === "paid") return;

  const order = data as ArtStudioOrder;
  const receivedCurrency = session.currency?.toLowerCase() || "";
  const expectedCurrency = order.currency.toLowerCase();
  const receivedAmount = session.amount_subtotal;
  const expectedAmount = expectedMinorAmount(Number(order.total), expectedCurrency);
  if (receivedCurrency !== expectedCurrency || receivedAmount !== expectedAmount) {
    console.error("[art-studio webhook] Payment amount mismatch", { reference, expectedCurrency, receivedCurrency, expectedAmount, receivedAmount });
    await sendNotificationEmail({
      subject: `Bansko NOW: проверка на плащане ${reference}`,
      title: "Stripe плащане с различна сума",
      intro: "Поръчката не е маркирана автоматично като платена. Провери я ръчно в Stripe и админ панела.",
      rows: [
        { label: "Поръчка", value: reference },
        { label: "Очаквана сума", value: `${expectedAmount} ${expectedCurrency}` },
        { label: "Получена сума", value: `${receivedAmount ?? "—"} ${receivedCurrency || "—"}` }
      ],
      actionUrl: `${siteUrl}/admin/art-studio/orders`,
      actionLabel: "Към поръчките"
    });
    return;
  }

  const { data: updated, error: updateError } = await supabase
    .from("art_studio_orders")
    .update({
      payment_status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_link_id: paymentLinkId(session),
      customer_email: session.customer_details?.email || order.customer_email,
      paid_at: new Date().toISOString()
    })
    .eq("id", order.id)
    .eq("payment_status", "pending")
    .select("*")
    .maybeSingle();
  if (updateError) throw updateError;
  if (updated) await notifyPaidOrder(updated as ArtStudioOrder);
}

async function markIncomplete(session: Stripe.Checkout.Session, status: "failed" | "expired") {
  const reference = session.client_reference_id;
  if (!reference) return;
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured");
  const { error } = await supabase
    .from("art_studio_orders")
    .update({ payment_status: status, stripe_checkout_session_id: session.id, stripe_payment_link_id: paymentLinkId(session) })
    .eq("order_number", reference)
    .eq("payment_status", "pending");
  if (error) throw error;
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !stripeWebhookSecret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, stripeWebhookSecret);
  } catch (error) {
    console.error("[art-studio webhook] Invalid signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await completeOrder(event.data.object);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await markIncomplete(event.data.object, "failed");
    } else if (event.type === "checkout.session.expired") {
      await markIncomplete(event.data.object, "expired");
    }
  } catch (error) {
    console.error("[art-studio webhook] Processing failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
