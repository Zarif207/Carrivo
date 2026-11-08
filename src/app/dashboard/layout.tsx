import { Suspense } from "react";
import { AuthedShell } from "@/components/layout/authed-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";

/** Customer area. The proxy checked the signed role cookie; AuthedShell re-verifies with the API. */
export default function CustomerLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthedShell roles="CUSTOMER">{children}</AuthedShell>
    </Suspense>
  );
}
