import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIES, getApiBaseUrl } from "@/lib/api/config";
import { endpoints } from "@/lib/api/endpoints";
import { GOOGLE_COOKIE_MAX_AGE, GOOGLE_COOKIE_PATH, GOOGLE_NEXT_COOKIE } from "@/lib/auth/google";
import { loginPath, safeNextPath } from "@/lib/auth/redirects";
import { cookieOptions } from "@/lib/auth/session";


/**
 * GET /api/auth/google/start?next=/dashboard
 * Creates a PKCE verifier (kept in a short-lived httpOnly cookie, never in a URL) and sends the
 * browser to the API with only its S256 challenge. Contract §3.6.
 */
export function GET(request: NextRequest) {
  let apiBase: string;
  try {
    apiBase = getApiBaseUrl();
  } catch {
    return NextResponse.redirect(new URL(loginPath(null, { error: "google_failed" }), request.url));
  }

  const verifier = randomBytes(32).toString("base64url"); // 43 chars, [A-Za-z0-9_-]
  const challenge = createHash("sha256").update(verifier).digest("base64url"); // 43 chars, no padding
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const target = `${apiBase}${endpoints.auth.googleStart}?challenge=${challenge}`;
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "no-store");
  const options = { ...cookieOptions(), path: GOOGLE_COOKIE_PATH, maxAge: GOOGLE_COOKIE_MAX_AGE };
  response.cookies.set(AUTH_COOKIES.googleVerifier, verifier, options);
  if (next) response.cookies.set(GOOGLE_NEXT_COOKIE, next, options);
  else response.cookies.set(GOOGLE_NEXT_COOKIE, "", { ...options, maxAge: 0 });
  return response;
}
