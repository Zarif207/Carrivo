"use client";

// Client: reads the signed-in user from the auth store.
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/types";

interface RoleGateProps {
  allow: Role | readonly Role[];
  children: ReactNode;
  /** Rendered for other roles and signed-out visitors (default: nothing). */
  fallback?: ReactNode;
}

/**
 * Shows or hides UI by role. This is presentation only: the API and requireRole() enforce access.
 */
export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { user } = useAuth();
  const roles: readonly Role[] = typeof allow === "string" ? [allow] : allow;
  return <>{user && roles.includes(user.role) ? children : fallback}</>;
}
