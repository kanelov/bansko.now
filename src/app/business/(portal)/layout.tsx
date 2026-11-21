import { Suspense } from "react";
import { BusinessShell } from "@/components/business/business-shell";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { formatBgDate, getBillingOverview } from "@/lib/business-platform/billing";
import { PortalClickFeedback } from "@/components/business/portal-click-feedback";

/* Всяка страница под /business минава оттук: без сесия и членство няма портал. */
export default async function BusinessPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBusinessOwner();
  const billing = await getBillingOverview(session.supabase, session.business.businessId);
  const badge = billing.active
    ? { paid: true, text: billing.paidUntil ? `до ${formatBgDate(billing.paidUntil).slice(0, 5)}` : "платен" }
    : { paid: false, text: "неплатен" };

  return (
    <BusinessShell business={session.business} memberships={session.memberships} isAdmin={session.isAdmin} billing={badge}>
      <Suspense fallback={null}>
        <PortalClickFeedback />
      </Suspense>
      {children}
    </BusinessShell>
  );
}
