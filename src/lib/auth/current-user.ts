import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import type { Role, UserProfile } from "@/types";
import { readSession, type Session } from "./session";

export interface CurrentUser {
  user: UserProfile;
  session: Session;
}

/**
 * The verified user for this request (deduplicated per render with React cache()).
 * The signed role cookie gets the request this far; GET /users/me is the source of truth.
 * Returns null when there is no valid session.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = readSession(await cookies());
  if (!session) return null;
  try {
    const { data } = await serverFetch<UserProfile>(endpoints.users.me, { auth: session.token, requireAuth: true });
    return { user: data, session };
  } catch (error) {
    if (ApiError.isApiError(error) && error.isUnauthorized) return null;
    throw error;
  }
});

/**
 * Layout guard. Server Components can't change cookies, so a dead or out-of-date session is sent
 * through /api/auth/session-expired, which clears the cookies and lands on /login.
 */
export async function requireRole(role: Role): Promise<UserProfile> {
  const current = await getCurrentUser();
  if (!current) redirect(`/api/auth/session-expired?reason=expired`);
  // Role changed on the server since login (sessions are revoked then, but be safe).
  if (current.user.role !== role || current.session.role !== current.user.role) {
    redirect(`/api/auth/session-expired?reason=role-changed`);
  }
  return current.user;
}
