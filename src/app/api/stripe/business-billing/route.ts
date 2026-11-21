import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applyCheckoutSession, businessPlans, recordBusinessPayment } from "@/lib/business-platform/billing";
import { stripeBusinessWebhookSecret } from "@/lib/env";
import { constructStripeEvent, getStripeClient, stripeWebhookSecrets } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BusinessBilling } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook за абонаментите на бизнесите. Събития:
 *  checkout.session.completed – първото плащане (и абонамент, и еднократно);
 *  invoice.paid (subscription_cycle) – всяко месечно подновяване;
 *  customer.subscription.updated / deleted – спрян или неплатен абонамент.
 * Всичко е идемпотентно: същата сесия или фактура не се записва два пъти.
 */
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const supabase = createSupabaseAdminClient();
  const secrets = stripeWebhookSecrets(stripeBusinessWebhookSecret);
  if (!stripe || !supabase || !secrets.length) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const event = constructStripeEvent(await request.text(), signature, secrets);
  if (!event) {
    console.error("[business billing webhook] signature did not match any configured secret");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await applyCheckoutSession(event.data.object as Stripe.Checkout.Session);
      return NextResponse.json({ received: true });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      /* Първата фактура се записва от checkout.session.completed; тук са само подновяванията. */
      if (invoice.billing_reason !== "subscription_cycle") return NextResponse.json({ received: true });

      const subscriptionId = invoiceSubscriptionId(invoice);
      if (!subscriptionId) return NextResponse.json({ received: true });

      const businessId = await businessForSubscription(supabase, subscriptionId, invoiceMetadata(invoice).business_id);
      if (!businessId) return NextResponse.json({ received: true, unknown: true });

      await recordBusinessPayment(supabase, {
        businessId,
        source: "stripe_subscription",
        amountCents: invoice.amount_paid ?? businessPlans.basic.priceCents,
        stripeInvoiceId: invoice.id,
        subscription: { id: subscriptionId, customerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null, status: "active" }
      });
      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const status: BusinessBilling["subscription_status"] =
        event.type === "customer.subscription.deleted" || subscription.status === "canceled"
          ? "canceled"
          : subscription.status === "past_due" || subscription.status === "unpaid"
            ? "past_due"
            : subscription.cancel_at_period_end
              ? "canceling"
              : "active";
      await supabase.from("business_billing").update({ subscription_status: status }).eq("stripe_subscription_id", subscription.id);
      return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("[business billing webhook]", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/* В по-новите версии на API абонаментът на фактурата е в parent.subscription_details. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  if (legacy) return typeof legacy === "string" ? legacy : legacy.id;
  const details = (invoice as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null }).parent
    ?.subscription_details?.subscription;
  if (!details) return null;
  return typeof details === "string" ? details : details.id;
}

function invoiceMetadata(invoice: Stripe.Invoice): Record<string, string> {
  const fromParent = (invoice as unknown as { parent?: { subscription_details?: { metadata?: Record<string, string> | null } | null } | null }).parent
    ?.subscription_details?.metadata;
  return fromParent ?? (invoice.metadata as Record<string, string> | null) ?? {};
}

async function businessForSubscription(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  subscriptionId: string,
  fallbackBusinessId?: string
) {
  const { data } = await supabase.from("business_billing").select("business_id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (data?.business_id) return data.business_id;
  return fallbackBusinessId && /^[0-9a-f-]{36}$/i.test(fallbackBusinessId) ? fallbackBusinessId : null;
}
