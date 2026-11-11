import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { AUTH_COOKIES } from "@/lib/api/config";
import { ROLES, type Role } from "@/types";
import { ROLE_CHANGE_HINT_COOKIE } from "./session-end";

/*
 * Session cookies (all httpOnly, SameSite=Lax, Secure in production):
 * - carrivo_session: the API's Bearer token.
 * - carrivo_role:    "ROLE.EXP.SIG" where SIG = HMAC-SHA256(SESSION_SECRET, "ROLE.EXP.sha256(token)").
 *   The proxy trusts it for routing without calling the API; it can't be forged or moved to
 *   another token. Layouts still re-verify the user against GET /users/me.
 */

export interface Session {
  token: string;
  role: Role;
  /** Token expiry (from the API's expiresAt). */
  expiresAt: Date;
}

/** Minimal cookie-store shape shared by `cookies()` and `NextResponse.cookies`. */
interface CookieReader {
  get(name: string): { value: string } | undefined;
}
interface CookieWriter {
  set(name: string, value: string, options: CookieOptions): unknown;
}
interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  expires?: Date;
  maxAge?: number;
}

export class SessionConfigError extends Error {}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new SessionConfigError("SESSION_SECRET is missing or shorter than 32 characters. Add it to the environment (see .env.example).");
  }
  return secret;
}

const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value);
const tokenDigest = (token: string) => createHash("sha256").update(token).digest("base64url");
const sign = (payload: string) => createHmac("sha256", getSecret()).update(payload).digest("base64url");

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function cookieOptions(expires?: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

export function encodeRoleCookie(role: Role, expiresAt: Date, token: string): string {
  const exp = Math.floor(expiresAt.getTime() / 1000);
  return `${role}.${exp}.${sign(`${role}.${exp}.${tokenDigest(token)}`)}`;
}

/**
 * Reads and verifies the session cookies. Returns null when absent, tampered with, or expired.
 *
 * `now` is explicit on purpose (Cache Components): route handlers and the proxy pass `Date.now()`
 * (always request time); Server Components must `await connection()` before reading the clock,
 * or Next reports "Date.now() while prerendering" in dev. Use getCurrentUser() there.
 */
export function readSession(store: CookieReader, now: number): Session | null {
  const token = store.get(AUTH_COOKIES.token)?.value;
  const roleCookie = store.get(AUTH_COOKIES.role)?.value;
  if (!token || !roleCookie) return null;

  const [role, expRaw, signature] = roleCookie.split(".");
  if (!role || !expRaw || !signature || !isRole(role) || !/^\d+$/.test(expRaw)) return null;

  let expected: string;
  try {
    expected = sign(`${role}.${expRaw}.${tokenDigest(token)}`);
  } catch {
    return null; // missing secret: treat as logged out (login reports the config error)
  }
  if (!safeEqual(signature, expected)) return null;

  const expiresAt = new Date(Number(expRaw) * 1000);
  if (expiresAt.getTime() <= now) return null;
  return { token, role, expiresAt };
}

/** Writes both cookies; they expire with the token. */
export function writeSession(store: CookieWriter, session: Session): void {
  const roleValue = encodeRoleCookie(session.role, session.expiresAt, session.token);
  store.set(AUTH_COOKIES.token, session.token, cookieOptions(session.expiresAt));
  store.set(AUTH_COOKIES.role, roleValue, cookieOptions(session.expiresAt));
}

export function clearSession(store: CookieWriter): void {
  for (const name of [AUTH_COOKIES.token, AUTH_COOKIES.role]) {
    store.set(name, "", { ...cookieOptions(), maxAge: 0 });
  }
  // The "role change expected" hint belongs to the session that just ended (lib/auth/session-end.ts).
  store.set(ROLE_CHANGE_HINT_COOKIE, "", { ...cookieOptions(), httpOnly: false, maxAge: 0 });
}

/** Fails fast (at login) when the signing secret isn't configured. */
export function assertSessionConfigured(): void {
  getSecret();
}
