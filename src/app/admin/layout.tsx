import { Suspense } from "react";
import { AuthedShell } from "@/components/layout/authed-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
import { STAFF_ROLES } from "@/lib/auth/permissions";

/** Admin area (ADMIN, and ADMIN_VIEWER read-only). The proxy checked the signed role cookie; AuthedShell re-verifies with the API. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthedShell roles={STAFF_ROLES}>{children}</AuthedShell>
    </Suspense>
  );
}
