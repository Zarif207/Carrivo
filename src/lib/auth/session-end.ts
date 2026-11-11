/*
 * Why a session ended, and where to send the user. Plain module (no imports): used by the client
 * fetcher, the /api/auth/session-expired route and the login notice, and unit-tested.
 *
 * The API answers 401 both for an expired token and for one it revoked (an admin approved a courier
 * application: the user is now a COURIER and must sign in again). It can't say which, so while the
 * user has a pending courier application the UI sets a small hint cookie; a 401 with the hint is
 * explained as a role change. clearSession() deletes the hint with the auth cookies.
 */

export type SessionEndReason = "expired" | "role-changed";

/** Not httpOnly on purpose: the browser sets it. It holds no secret (just "1"). */
export const ROLE_CHANGE_HINT_COOKIE = "carrivo_role_change";

export const SESSION_END_MESSAGES: Record<SessionEndReason, string> = {
  expired: "Your session ended. Log in again.",
  "role-changed": "Your role changed, please sign in again.",
};

export const reasonFromHint = (hint: string | null | undefined): SessionEndReason => (hint === "1" ? "role-changed" : "expired");

/** Reads one cookie from a `document.cookie`-style string. */
export function readCookie(cookieString: string, name: string): string | null {
  for (const part of cookieString.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

const NO_RETURN = /^\/(login|register|api|auth)(\/|$)/;

/**
 * /login with the reason and, when it makes sense, the page to come back to. Never points `next` at
 * /login, /register, /api or /auth, so ending a session from those pages can't loop.
 */
export function sessionEndLoginUrl(pathname: string, search: string, reason: SessionEndReason): string {
  const params = new URLSearchParams({ reason });
  const path = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
  if (!NO_RETURN.test(path) && path !== "/") params.set("next", `${path}${search}`);
  return `/login?${params.toString()}`;
}
