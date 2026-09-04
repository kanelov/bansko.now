import "server-only";
import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/env";

let stripeClient: Stripe | null | undefined;

export function getStripeClient() {
  if (stripeClient !== undefined) return stripeClient;
  stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey, { maxNetworkRetries: 2 }) : null;
  return stripeClient;
}

/**
 * Stripe uses a different signing secret per mode, so an endpoint that must accept both test
 * and live traffic needs several secrets. The environment variable may hold them separated by
 * commas or spaces; each is tried until one verifies the signature.
 */
export function stripeWebhookSecrets(value: string | null | undefined) {
  return String(value || "")
    .split(/[,\s]+/)
    .map((secret) => secret.trim())
    .filter((secret) => secret.startsWith("whsec_"));
}

export function constructStripeEvent(payload: string, signature: string, secrets: string[]) {
  const stripe = getStripeClient();
  if (!stripe || !secrets.length) return null;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      // Wrong secret for this mode; try the next one.
    }
  }
  return null;
}
