import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PortalClickFeedback } from "@/components/business/portal-click-feedback";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <AdminShell>
      <Suspense fallback={null}>
        <PortalClickFeedback />
      </Suspense>
      {children}
    </AdminShell>
  );
}
