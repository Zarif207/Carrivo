import { Suspense, type ReactNode } from "react";
import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
import { LiveShell } from "@/components/layout/live-shell";
import { requireSignedIn } from "@/lib/auth/current-user";

/**
 * /courier-application: any signed-in role (the proxy sends visitors to /login and back). Customers
 * apply here; couriers and staff get a short explanation in their own shell instead of a bounce.
 */
async function SignedInShell({ children }: { children: ReactNode }) {
  const user = await requireSignedIn();
  return (
    <>
      <AuthHydrator user={user} />
      <LiveShell user={{ name: user.name, email: user.email, image: user.image, role: user.role }}>{children}</LiveShell>
    </>
  );
}

export default function CourierApplicationLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <SignedInShell>{children}</SignedInShell>
    </Suspense>
  );
}
