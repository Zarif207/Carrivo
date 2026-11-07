import type { ReactNode } from "react";
import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { requireRole } from "@/lib/auth/current-user";
import type { Role } from "@/types";
import { DashboardShell } from "./dashboard-shell";

/**
 * Server gate for a role's area: re-verifies the user against GET /users/me (the proxy only checked
 * the signed cookie), then renders the shell. Reads cookies, so layouts render it under <Suspense>.
 */
export async function AuthedShell({ role, children }: { role: Role; children: ReactNode }) {
  const user = await requireRole(role);
  return (
    <>
      <AuthHydrator user={user} />
      <DashboardShell user={{ name: user.name, email: user.email, image: user.image, role: user.role }}>{children}</DashboardShell>
    </>
  );
}
