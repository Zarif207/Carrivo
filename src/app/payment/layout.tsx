import { Suspense } from "react";
import { AuthedShell } from "@/components/layout/authed-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";

/**
 * Stripe Checkout returns to /payment/success and /payment/cancel. Customer-only: the proxy checks
 * the signed role cookie (logged-out visitors go to /login?next=<this URL>), AuthedShell re-verifies.
 */
export default function PaymentLayout({ children }: LayoutProps<"/payment">) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthedShell role="CUSTOMER">{children}</AuthedShell>
    </Suspense>
  );
}
