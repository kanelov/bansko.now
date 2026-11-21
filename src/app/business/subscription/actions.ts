"use server";

import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { cancelBusinessSubscription, createBusinessCheckout, type CheckoutMode } from "@/lib/business-platform/billing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const subscriptionPath = "/business/subscription";

/** Отваря Stripe Checkout: месечен абонамент или едно плащане за един месец. */
export async function startBusinessCheckoutAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner();
  const mode: CheckoutMode = formData.get("mode") === "subscription" ? "subscription" : "one_time";
  const { data } = await supabase.auth.getUser();

  let url: string | null = null;
  try {
    url = await createBusinessCheckout({ businessId: business.businessId, businessName: business.name, mode, email: data.user?.email ?? null });
  } catch (error) {
    console.error("[business checkout]", error);
  }

  redirect(url ?? `${subscriptionPath}?error=stripe`);
}

/** Спира месечния абонамент в края на платения месец. Пари не се връщат. */
export async function cancelBusinessSubscriptionAction() {
  const { supabase, business } = await requireBusinessOwner();
  const { data: billing } = await supabase
    .from("business_billing")
    .select("stripe_subscription_id, subscription_status")
    .eq("business_id", business.businessId)
    .maybeSingle();

  if (!billing?.stripe_subscription_id || billing.subscription_status !== "active") {
    redirect(`${subscriptionPath}?error=no-subscription`);
  }

  try {
    await cancelBusinessSubscription(billing.stripe_subscription_id);
    /* Собственикът не пише в таблицата; статусът се сменя от сървъра (webhook-ът ще го потвърди). */
    const admin = createSupabaseAdminClient();
    if (admin) {
      await admin.from("business_billing").update({ subscription_status: "canceling" }).eq("business_id", business.businessId);
    }
  } catch (error) {
    console.error("[business cancel subscription]", error);
    redirect(`${subscriptionPath}?error=cancel`);
  }

  redirect(`${subscriptionPath}?saved=canceled`);
}
