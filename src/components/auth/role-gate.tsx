"use client";

// Client: reads the signed-in user from the auth store.
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { canMutate, isReadOnly } from "@/lib/auth/permissions";
import type { Role } from "@/types";

interface RoleGateProps {
  allow: Role | readonly Role[];
  children: ReactNode;
  /** Rendered for other roles and signed-out visitors (default: nothing). */
  fallback?: ReactNode;
}

/**
 * Shows or hides UI by role. This is presentation only: the API and requireRole() enforce access.
 * While the user is still loading, nothing is shown (write controls never flash for a viewer).
 */
export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { user } = useAuth();
  const roles: readonly Role[] = typeof allow === "string" ? [allow] : allow;
  return <>{user && roles.includes(user.role) ? children : fallback}</>;
}

/** May the signed-in user make admin changes? (Only ADMIN; ADMIN_VIEWER is read-only.) */
export function useCanMutate(): boolean {
  const { user } = useAuth();
  return canMutate(user?.role);
}

/** Is the signed-in user a read-only account? */
export function useIsReadOnly(): boolean {
  const { user } = useAuth();
  return isReadOnly(user?.role);
}

/**
 * Wraps every admin write control (create, edit, delete, assign, status steps, refunds, activation).
 * Read-only accounts see `readOnly` instead (default: nothing). Presentation only: the BFF and the API
 * refuse the writes too.
 */
export function CanMutate({ children, readOnly = null }: { children: ReactNode; readOnly?: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return <>{canMutate(user.role) ? children : isReadOnly(user.role) ? readOnly : null}</>;
}
