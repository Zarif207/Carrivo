import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIES } from "@/lib/api/config";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import { GOOGLE_COOKIE_PATH, GOOGLE_NEXT_COOKIE } from "@/lib/auth/google";
import { clientIpOf } from "@/lib/auth/http";
import { loginPath, postLoginPath, safeNextPath } from "@/lib/auth/redirects";
import { cookieOptions, writeSession } from "@/lib/auth/session";
import { GOOGLE_AUTH_ERRORS, type AuthResult, type GoogleAuthError } from "@/types";

const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

/**
 * GET /auth/google/callback?code=… | ?error=… (the path the API redirects to, FRONTEND_URL + this).
 * Exchanges the one-time code + our verifier for a session server-to-server, sets the cookies and
 * lands on the user's home (or the saved `next`). Errors go back to /login?error=<code>.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const verifier = request.cookies.get(AUTH_COOKIES.googleVerifier)?.value;
  const next = safeNextPath(request.cookies.get(GOOGLE_NEXT_COOKIE)?.value);

  const finish = (target: string, build?: (response: NextResponse) => void) => {
    const response = NextResponse.redirect(new URL(target, request.url));
    response.headers.set("Cache-Control", "no-store");
    // The verifier is single-use: always remove it.
    const expired = { ...cookieOptions(), path: GOOGLE_COOKIE_PATH, maxAge: 0 };
    response.cookies.set(AUTH_COOKIES.googleVerifier, "", expired);
    response.cookies.set(GOOGLE_NEXT_COOKIE, "", expired);
    build?.(response);
    return response;
  };
  const fail = (code: GoogleAuthError) => finish(loginPath(next, { error: code }));

  const error = params.get("error");
  if (error) return fail((GOOGLE_AUTH_ERRORS as readonly string[]).includes(error) ? (error as GoogleAuthError) : "google_failed");

  const code = params.get("code");
  if (!code || !CODE_PATTERN.test(code) || !verifier || !VERIFIER_PATTERN.test(verifier)) return fail("google_failed");

  try {
    const { data } = await serverFetch<AuthResult>(endpoints.auth.googleExchange, {
      method: "POST",
      auth: false,
      clientIp: clientIpOf(request),
      body: { code, codeVerifier: verifier },
    });
    return finish(postLoginPath(data.user.role, next), (response) =>
      writeSession(response.cookies, { token: data.token, role: data.user.role, expiresAt: new Date(data.expiresAt) }),
    );
  } catch (err) {
    if (ApiError.isApiError(err) && err.status === 403) return fail("account_deactivated");
    return fail("google_failed");
  }
}
