import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendNotificationEmail } from "@/lib/email";
import { siteUrl, stripeWebhookSecret } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PhotoLicenseOrder } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook for photo licenses. Fulfilment happens only here, never on the success page.
 * Idempotent: an event that was already applied leaves the order untouched.
 */
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const supabase = createSupabaseAdminClient();
  if (!stripe || !supabase || !stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, stripeWebhookSecret);
  } catch (error) {
    console.error("[photo license webhook signature]", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = typeof session.metadata?.order_id === "string" ? session.metadata.order_id : null;
  if (!orderId) return NextResponse.json({ received: true });

  const { data: order } = await supabase.from("photo_license_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ received: true });

  const typed = order as PhotoLicenseOrder;
  if (typed.status === "paid") return NextResponse.json({ received: true, duplicate: true });
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });

  // The amount is checked against the database, never against the browser or the session metadata.
  const expected = Math.round(Number(typed.amount) * 100);
  if (session.amount_total !== expected || (session.currency || "eur").toLowerCase() !== typed.currency.toLowerCase()) {
    console.error("[photo license amount mismatch]", { order: typed.order_code, expected, received: session.amount_total });
    return NextResponse.json({ received: true, mismatch: true });
  }

  const { error } = await supabase
    .from("photo_license_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripe_event_id: event.id
    })
    .eq("id", typed.id)
    .eq("status", "pending");
  if (error) {
    console.error("[photo license update failed]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const { data: photo } = await supabase.from("photos").select("photo_code,title_bg,title_en,slug").eq("id", typed.photo_id).maybeSingle();
  const isEnglish = typed.locale === "en";
  const title = (isEnglish ? photo?.title_en || photo?.title_bg : photo?.title_bg) || photo?.photo_code || "";
  const downloadUrl = `${siteUrl}/api/photo-license/download/${typed.download_token}`;
  const licenseUrl = `${siteUrl}/${typed.locale === "en" ? "en/" : ""}photos/license/success?order=${typed.order_code}`;

  await Promise.allSettled([
    sendNotificationEmail({
      to: typed.customer_email,
      subject: isEnglish ? `Your license ${typed.order_code}` : `Твоят лиценз ${typed.order_code}`,
      title: isEnglish ? "Thank you, the license is ready" : "Благодарим, лицензът е готов",
      intro: isEnglish
        ? "The download link below works for the file included in your license. The license terms are attached to your order."
        : "Линкът по-долу сваля файла, включен в лиценза. Условията на лиценза са записани към поръчката.",
      rows: [
        { label: isEnglish ? "Order" : "Поръчка", value: typed.order_code },
        { label: isEnglish ? "Photograph" : "Фотография", value: `${title} (${photo?.photo_code || ""})` },
        { label: isEnglish ? "License" : "Лиценз", value: typed.license_code },
        { label: isEnglish ? "Amount" : "Сума", value: `${Number(typed.amount).toFixed(2)} ${typed.currency}` },
        { label: isEnglish ? "Download" : "Сваляне", value: downloadUrl }
      ],
      actionUrl: licenseUrl,
      actionLabel: isEnglish ? "Open the license" : "Отвори лиценза"
    }),
    sendNotificationEmail({
      subject: `Продаден лиценз ${typed.order_code}`,
      title: "Нов лиценз за фотография",
      replyTo: typed.customer_email,
      rows: [
        { label: "Поръчка", value: typed.order_code },
        { label: "Фотография", value: `${title} (${photo?.photo_code || ""})` },
        { label: "Лиценз", value: typed.license_code },
        { label: "Сума", value: `${Number(typed.amount).toFixed(2)} ${typed.currency}` },
        { label: "Клиент", value: [typed.customer_name, typed.company_name].filter(Boolean).join(" · ") },
        { label: "Email", value: typed.customer_email }
      ]
    })
  ]);

  return NextResponse.json({ received: true });
}
