/**
 * Shared API configuration. Holds no secrets, so it is safe to import anywhere;
 * `getApiBaseUrl()` only works on the server because API_BASE_URL is not a NEXT_PUBLIC_ variable.
 */

/** Cookie names used by the BFF (all httpOnly; the browser's JS never reads them). */
export const AUTH_COOKIES = {
  /** Bearer token from login/register/Google/refresh. */
  token: "carrivo_session",
  /** "ROLE.EXP.HMAC": role + token expiry, signed with SESSION_SECRET and bound to the token (lib/auth/session.ts). */
  role: "carrivo_role",
  /** PKCE verifier for Google sign-in, lives for the duration of the redirect only. */
  googleVerifier: "carrivo_google_verifier",
} as const;

/** Default timeout for server-side API calls. */
export const API_TIMEOUT_MS = 15_000;

/** Max page size accepted by every list endpoint. */
export const MAX_PAGE_LIMIT = 100;

/** Proof-of-delivery upload limit enforced by the API (we compress below this on the client). */
export const PROOF_MAX_BYTES = 4 * 1024 * 1024;
export const PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function getApiBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL is not set. Add it to .env.local (see .env.example).");
  }
  return url.replace(/\/+$/, "");
}
