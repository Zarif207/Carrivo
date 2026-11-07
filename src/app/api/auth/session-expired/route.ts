import { NextResponse, type NextRequest } from "next/server";
import { loginPath, safeNextPath } from "@/lib/auth/redirects";
import { clearSession } from "@/lib/auth/session";

const REASONS = new Set(["expired", "role-changed"]);

/**
 * GET /api/auth/session-expired?reason=&next=: where layouts send a session the API rejected.
 * Server Components can't change cookies, so this clears them and lands on /login with a notice.
 * (Clearing your own session is harmless, so no Origin check is needed for this GET.)
 */
export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("reason");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const target = loginPath(next, { reason: reason && REASONS.has(reason) ? reason : "expired" });
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set("Cache-Control", "no-store");
  clearSession(response.cookies);
  return response;
}
