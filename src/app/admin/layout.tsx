import { Suspense } from "react";
import { AuthedShell } from "@/components/layout/authed-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";

/** Admin area. The proxy checked the signed role cookie; AuthedShell re-verifies with the API. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthedShell role="ADMIN">{children}</AuthedShell>
    </Suspense>
  );
}
