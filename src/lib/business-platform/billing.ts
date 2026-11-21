import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { siteUrl } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BusinessBilling, BusinessPayment, BusinessPaymentSource, Database } from "@/lib/types";

/**
 * Абонаментите на бизнесите. Засега само се записва кой какво е платил –
 * нищо в портала не се заключва. Един план (basic, 10 € на месец) отключва
 * всичко; вторият е обявен като „очаквайте скоро“.
 *
 * Плащане идва по три пътя и всички минават през recordBusinessPayment():
 *  – връщане от Stripe (страницата /business/subscription проверява сесията);
 *  – Stripe webhook (/api/stripe/business-billing) – първото плащане и
 *    месечните подновявания;
 *  – „Маркирай като платен“ от админа.
 * Плащането е идемпотентно по номера на сесията или фактурата в Stripe.
 */

type Client = SupabaseClient<Database>;

export const businessPlans = {
  basic: { name: "Бизнес", priceCents: 1000, comingSoon: false },
  plus: { name: "Бизнес Плюс", priceCents: 2000, comingSoon: true }
} as const;

export type BusinessPlanKey = keyof typeof businessPlans;

/**
 * Решение на собственика (21.11.2026): засега всеки бизнес се води платен,
 * докато не настрои месечните подновявания в Stripe. Плащанията пак се
 * записват. За да започне истинската проверка – false.
 */
export const everyBusinessCountsAsPaid = true;

/** Какво отключва планът „Бизнес“ (засега – всичко в портала). */
export const basicPlanFeatures = [
  "Профил в каталога на Bansko NOW",
  "QR меню за масите на български и английски",
  "Работно време и „Отворено сега“",
  "Екрани за телевизорите: меню, снимки, видео и HTML слайдове",
  "Меню за печат с QR код",
  "Бранд: лого, цветове и шрифтове"
];

export type BillingOverview = {
  billing: BusinessBilling | null;
  payments: BusinessPayment[];
  active: boolean;
  paidUntil: string | null;
};

export function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
}

/** Дата + месеци, без да прескача края на месеца (31.01 + 1 = 28/29.02). */
export function addMonths(iso: string, months: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function formatBgDate(iso: string | null) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

export function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export async function getBillingOverview(supabase: Client, businessId: string): Promise<BillingOverview> {
  const [{ data: billing }, { data: payments }] = await Promise.all([
    supabase.from("business_billing").select("*").eq("business_id", businessId).maybeSingle(),
    supabase.from("business_payments").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(24)
  ]);

  const paidUntil = billing?.paid_until ?? null;
  const paid = Boolean(paidUntil && paidUntil >= todayIso());
  return { billing: billing ?? null, payments: payments ?? [], active: paid || everyBusinessCountsAsPaid, paidUntil: paid ? paidUntil : null };
}

type RecordInput = {
  businessId: string;
  source: BusinessPaymentSource;
  amountCents: number;
  months?: number;
  stripeSessionId?: string | null;
  stripeInvoiceId?: string | null;
  note?: string;
  createdBy?: string | null;
  subscription?: { id: string; customerId: string | null; status: BusinessBilling["subscription_status"] } | null;
};

/**
 * Записва едно плащане и удължава „платен до“. Новият период почва от днес
 * или от края на досегашния, ако той още тече. Повторно извикване със
 * същата сесия/фактура не прави нищо (уникален индекс).
 */
export async function recordBusinessPayment(client: Client, input: RecordInput): Promise<{ recorded: boolean; paidUntil: string | null }> {
  const months = Math.min(24, Math.max(1, Math.round(input.months ?? 1)));

  if (input.stripeSessionId || input.stripeInvoiceId) {
    const column = input.stripeSessionId ? "stripe_session_id" : "stripe_invoice_id";
    const value = (input.stripeSessionId ?? input.stripeInvoiceId) as string;
    const { data: existing } = await client.from("business_payments").select("id").eq(column, value).maybeSingle();
    if (existing) {
      const { data: billing } = await client.from("business_billing").select("paid_until").eq("business_id", input.businessId).maybeSingle();
      return { recorded: false, paidUntil: billing?.paid_until ?? null };
    }
  }

  const { data: billing } = await client.from("business_billing").select("*").eq("business_id", input.businessId).maybeSingle();
  const today = todayIso();
  const start = billing?.paid_until && billing.paid_until >= today ? billing.paid_until : today;
  const end = addMonths(start, months);

  const { error: paymentError } = await client.from("business_payments").insert({
    business_id: input.businessId,
    plan: "basic",
    source: input.source,
    amount_cents: Math.max(0, Math.round(input.amountCents)),
    currency: "EUR",
    months,
    period_start: start,
    period_end: end,
    stripe_session_id: input.stripeSessionId ?? null,
    stripe_invoice_id: input.stripeInvoiceId ?? null,
    note: (input.note ?? "").slice(0, 300),
    created_by: input.createdBy ?? null
  });

  if (paymentError) {
    /* 23505 = същото плащане е записано междувременно от другия път (webhook или връщане). */
    if (paymentError.code === "23505") return { recorded: false, paidUntil: billing?.paid_until ?? null };
    throw new Error(paymentError.message);
  }

  const { error: billingError } = await client.from("business_billing").upsert(
    {
      business_id: input.businessId,
      plan: "basic",
      paid_until: end,
      ...(input.subscription
        ? {
            stripe_subscription_id: input.subscription.id,
            stripe_customer_id: input.subscription.customerId,
            subscription_status: input.subscription.status
          }
        : {})
    },
    { onConflict: "business_id" }
  );
  if (billingError) throw new Error(billingError.message);

  return { recorded: true, paidUntil: end };
}

/* ---------------------------------------------------------------- Stripe */

export type CheckoutMode = "subscription" | "one_time";

/** Stripe Checkout за план „Бизнес“: месечен абонамент или еднократно за един месец. */
export async function createBusinessCheckout(input: { businessId: string; businessName: string; mode: CheckoutMode; email?: string | null }) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Плащането с карта още не е настроено.");

  const plan = businessPlans.basic;
  const metadata = { kind: "business_billing", business_id: input.businessId, plan: "basic", mode: input.mode };
  const productName = `Bansko NOW – план „${plan.name}“`;
  const description = `${input.businessName} · ${input.mode === "subscription" ? "месечен абонамент" : "един месец"}`;

  const session = await stripe.checkout.sessions.create({
    mode: input.mode === "subscription" ? "subscription" : "payment",
    customer_email: input.email || undefined,
    client_reference_id: input.businessId,
    metadata,
    locale: "bg",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: plan.priceCents,
          product_data: { name: productName, description },
          ...(input.mode === "subscription" ? { recurring: { interval: "month" as const } } : {})
        }
      }
    ],
    ...(input.mode === "subscription" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    success_url: `${siteUrl}/business/subscription?checkout={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/business/subscription?canceled=1`
  });

  if (!session.url) throw new Error("Stripe не върна адрес за плащане.");
  return session.url;
}

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Прилага платена Checkout сесия. Вика се от връщането в портала и от
 * webhook-а; двата пътя не могат да запишат плащането два пъти.
 * expectedBusinessId: при връщане в портала – текущият бизнес на собственика.
 */
export async function applyCheckoutSession(session: Stripe.Checkout.Session, expectedBusinessId?: string) {
  const metadata = session.metadata ?? {};
  if (metadata.kind !== "business_billing" || !metadata.business_id) return { applied: false, reason: "other" as const };
  if (expectedBusinessId && metadata.business_id !== expectedBusinessId) return { applied: false, reason: "business" as const };

  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!paid) return { applied: false, reason: "unpaid" as const };
  if ((session.currency ?? "eur").toLowerCase() !== "eur" || (session.amount_total ?? 0) < businessPlans.basic.priceCents) {
    return { applied: false, reason: "amount" as const };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Липсва ключът на сървъра за базата.");

  const subscriptionId = stripeId(session.subscription as string | { id: string } | null);
  const result = await recordBusinessPayment(admin, {
    businessId: metadata.business_id,
    source: session.mode === "subscription" ? "stripe_subscription" : "stripe_one_time",
    amountCents: session.amount_total ?? businessPlans.basic.priceCents,
    stripeSessionId: session.id,
    subscription: subscriptionId
      ? { id: subscriptionId, customerId: stripeId(session.customer as string | { id: string } | null), status: "active" }
      : null
  });
  return { applied: result.recorded, reason: "ok" as const, paidUntil: result.paidUntil };
}

/** Спира месечния абонамент в края на платения период (не връща пари). */
export async function cancelBusinessSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Плащането с карта не е настроено.");
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}
