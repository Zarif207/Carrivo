"use client";

import { ROLE_CHANGE_HINT_COOKIE, readCookie, reasonFromHint, type SessionEndReason } from "./session-end";

/** 30 days: a pending application can wait that long; the cookie is cleared on any sign-out. */
const MAX_AGE_S = 30 * 24 * 60 * 60;

/** Remember (or forget) that this session may end because of a role change. See lib/auth/session-end.ts. */
export function setRoleChangeHint(expected: boolean): void {
  if (typeof document === "undefined") return;
  const has = readCookie(document.cookie, ROLE_CHANGE_HINT_COOKIE) === "1";
  if (has === expected) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = expected
    ? `${ROLE_CHANGE_HINT_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_S}; SameSite=Lax${secure}`
    : `${ROLE_CHANGE_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/** Why the current session just ended, as far as the browser can tell. */
export function currentSessionEndReason(): SessionEndReason {
  return typeof document === "undefined" ? "expired" : reasonFromHint(readCookie(document.cookie, ROLE_CHANGE_HINT_COOKIE));
}
