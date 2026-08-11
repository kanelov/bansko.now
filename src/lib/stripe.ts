import "server-only";
import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/env";

let stripeClient: Stripe | null | undefined;

export function getStripeClient() {
  if (stripeClient !== undefined) return stripeClient;
  stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey, { maxNetworkRetries: 2 }) : null;
  return stripeClient;
}
