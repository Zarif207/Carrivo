import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
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
  // Request-time only: opt out of prerendering before touching cookies or the clock.
  await connection();
  const session = readSession(await cookies(), Date.now());
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
 * Guard for pages any signed-in role may open (e.g. /courier-application, which explains itself to
 * each role). Same session checks as requireRole, without the role filter.
 */
export async function requireSignedIn(): Promise<UserProfile> {
  const current = await getCurrentUser();
  if (!current) redirect(`/api/auth/session-expired?reason=expired`);
  if (current.session.role !== current.user.role) redirect(`/api/auth/session-expired?reason=role-changed`);
  return current.user;
}

/**
 * Layout guard. Server Components can't change cookies, so a dead or out-of-date session is sent
 * through /api/auth/session-expired, which clears the cookies and lands on /login.
 */
export async function requireRole(allowed: Role | readonly Role[]): Promise<UserProfile> {
  const roles: readonly Role[] = typeof allowed === "string" ? [allowed] : allowed;
  const current = await getCurrentUser();
  if (!current) redirect(`/api/auth/session-expired?reason=expired`);
  // Role changed on the server since login (sessions are revoked then, but be safe).
  if (!roles.includes(current.user.role) || current.session.role !== current.user.role) {
    redirect(`/api/auth/session-expired?reason=role-changed`);
  }
  return current.user;
}
