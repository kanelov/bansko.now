import { BusinessShell } from "@/components/business/business-shell";
import { requireBusinessOwner } from "@/lib/business-platform/auth";

/* Всяка страница под /business минава оттук: без сесия и членство няма портал. */
export default async function BusinessPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBusinessOwner();

  return (
    <BusinessShell business={session.business} memberships={session.memberships} isAdmin={session.isAdmin}>
      {children}
    </BusinessShell>
  );
}
