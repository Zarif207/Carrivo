import { Suspense } from "react";
import { AuthedShell } from "@/components/layout/authed-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";

/** Courier area. The proxy checked the signed role cookie; AuthedShell re-verifies with the API. */
export default function CourierLayout({ children }: LayoutProps<"/courier">) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthedShell role="COURIER">{children}</AuthedShell>
    </Suspense>
  );
}
