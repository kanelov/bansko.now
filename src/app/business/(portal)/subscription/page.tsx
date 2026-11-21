import type { Metadata } from "next";
import { cancelBusinessSubscriptionAction } from "@/app/business/subscription/actions";
import { ConfirmButton } from "@/components/business/confirm-button";
import { SubscribeDialog } from "@/components/business/subscribe-dialog";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import {
  applyCheckoutSession,
  basicPlanFeatures,
  businessPlans,
  formatBgDate,
  formatEuro,
  getBillingOverview
} from "@/lib/business-platform/billing";
import { getStripeClient } from "@/lib/stripe";
import type { BusinessPaymentSource } from "@/lib/types";

export const metadata: Metadata = {
  title: "Абонамент"
};

const sourceLabels: Record<BusinessPaymentSource, string> = {
  stripe_subscription: "Абонамент с карта",
  stripe_one_time: "Еднократно с карта",
  manual: "Отбелязано от Bansko NOW"
};

const errorMessages: Record<string, string> = {
  stripe: "Плащането с карта не успя да се отвори. Опитай пак след малко.",
  "no-subscription": "Няма активен месечен абонамент за спиране.",
  cancel: "Абонаментът не се спря. Опитай пак или ни пиши."
};

/* Връщането от Stripe: проверява сесията на сървъра и записва плащането (идемпотентно). */
async function confirmCheckout(sessionId: string, businessId: string) {
  const stripe = getStripeClient();
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return "error" as const;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await applyCheckoutSession(session, businessId);
    if (result.reason === "ok") return "paid" as const;
    if (result.reason === "unpaid") return "pending" as const;
    return "error" as const;
  } catch (error) {
    console.error("[business checkout return]", error);
    return "error" as const;
  }
}

export default async function SubscriptionPage({
  searchParams
}: {
  searchParams: Promise<{ checkout?: string; canceled?: string; error?: string; saved?: string }>;
}) {
  const [{ checkout, canceled, error, saved }, { supabase, business }] = await Promise.all([searchParams, requireBusinessOwner()]);
  const checkoutResult = checkout ? await confirmCheckout(checkout, business.businessId) : null;
  const overview = await getBillingOverview(supabase, business.businessId);
  const basic = businessPlans.basic;
  const priceLabel = `${formatEuro(basic.priceCents)} на месец`;
  const subscriptionStatus = overview.billing?.subscription_status ?? "none";

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Абонамент</p>
        <h1 className={portalUi.h1}>Абонамент за {business.name}</h1>
      </header>

      {checkoutResult === "paid" ? (
        <div className={portalUi.notice} role="status">
          Благодарим! Плащането е получено{overview.paidUntil ? ` и абонаментът е платен до ${formatBgDate(overview.paidUntil)}` : ""}.
        </div>
      ) : null}
      {checkoutResult === "pending" ? (
        <div className={portalUi.notice} role="status">
          Плащането още се обработва. Обнови страницата след минута.
        </div>
      ) : null}
      {checkoutResult === "error" ? (
        <div className={portalUi.alert} role="alert">
          Не успяхме да потвърдим плащането. Ако картата е таксувана, пиши ни и ще го отбележим ръчно.
        </div>
      ) : null}
      {canceled ? (
        <div className={portalUi.alert} role="status">
          Плащането е прекъснато, нищо не е таксувано.
        </div>
      ) : null}
      {saved === "canceled" ? (
        <div className={portalUi.notice} role="status">
          Месечният абонамент е спрян. Остава активен до края на платения месец.
        </div>
      ) : null}
      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.stripe}
        </div>
      ) : null}

      <section className={portalUi.card + " grid gap-3"}>
        <h2 className={portalUi.h2}>Сега</h2>
        {overview.active ? (
          <p className="text-base">
            <span className={portalUi.badge + " mr-2 bg-sage text-forest"}>Платен</span>
            План „{basic.name}“ е платен до <strong>{formatBgDate(overview.paidUntil)}</strong>.
          </p>
        ) : (
          <p className="text-base">
            <span className={portalUi.badge + " mr-2 bg-clay/15 text-clay"}>Неплатен</span>
            {overview.paidUntil ? `Последният платен период свърши на ${formatBgDate(overview.paidUntil)}.` : "Още няма плащане."}
          </p>
        )}
        {subscriptionStatus === "active" ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-650">
            <span>Месечният абонамент с карта е включен и се подновява сам.</span>
            <form action={cancelBusinessSubscriptionAction}>
              <ConfirmButton message="Да спра ли месечния абонамент? Остава активен до края на платения месец." className={portalUi.smallButton}>
                Спри абонамента
              </ConfirmButton>
            </form>
          </div>
        ) : null}
        {subscriptionStatus === "canceling" ? (
          <p className="text-sm text-stone-650">Абонаментът е спрян и няма да се поднови. Остава активен до края на платения месец.</p>
        ) : null}
        {subscriptionStatus === "past_due" ? (
          <p className="text-sm text-clay">Последното месечно плащане не мина. Провери картата или плати един месец отделно.</p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className={portalUi.card + " grid content-start gap-4 border-2 border-forest"}>
          <div>
            <p className={portalUi.eyebrow}>План</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-forest">{basic.name}</h2>
            <p className="mt-2 text-3xl font-semibold">
              {formatEuro(basic.priceCents)} <span className="text-base font-normal text-stone-650">на месец</span>
            </p>
          </div>
          <ul className="grid gap-2 text-sm">
            {basicPlanFeatures.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span aria-hidden className="text-forest">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {subscriptionStatus === "active" ? (
            <p className="text-sm font-semibold text-forest">Абонаментът е включен.</p>
          ) : (
            <SubscribeDialog priceLabel={priceLabel} label={overview.active ? "Плати още един месец" : "Абонирай се"} />
          )}
        </article>

        <article className={portalUi.card + " grid content-start gap-4 bg-paper"}>
          <div>
            <p className={portalUi.eyebrow}>План</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-stone-650">{businessPlans.plus.name}</h2>
          </div>
          <p className="text-lg font-semibold text-stone-650">Очаквайте скоро</p>
        </article>
      </section>

      <section className={portalUi.card + " grid gap-3"}>
        <h2 className={portalUi.h2}>Плащания</h2>
        {overview.payments.length === 0 ? (
          <p className="text-sm text-stone-650">Още няма плащания.</p>
        ) : (
          <ul className="grid gap-2">
            {overview.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-[var(--stone)] px-4 py-3 text-sm">
                <span>
                  <strong>
                    {formatBgDate(payment.period_start)} – {formatBgDate(payment.period_end)}
                  </strong>
                  <span className="ml-2 text-stone-650">{sourceLabels[payment.source]}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatEuro(payment.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
