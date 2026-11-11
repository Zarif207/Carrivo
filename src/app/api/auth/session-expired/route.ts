import { NextResponse, type NextRequest } from "next/server";
import { loginPath, safeNextPath } from "@/lib/auth/redirects";
import { clearSession } from "@/lib/auth/session";
import { ROLE_CHANGE_HINT_COOKIE, reasonFromHint } from "@/lib/auth/session-end";

const REASONS = new Set(["expired", "role-changed"]);

/**
 * GET /api/auth/session-expired?reason=&next=: where layouts send a session the API rejected.
 * Server Components can't change cookies, so this clears them and lands on /login with a notice.
 * (Clearing your own session is harmless, so no Origin check is needed for this GET.)
 */
export function GET(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get("reason");
  // A 401 while a courier application was pending is almost always its approval (sessions revoked).
  const hinted = reasonFromHint(request.cookies.get(ROLE_CHANGE_HINT_COOKIE)?.value);
  const reason = asked && REASONS.has(asked) && asked !== "expired" ? asked : hinted;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const target = loginPath(next, { reason });
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set("Cache-Control", "no-store");
  clearSession(response.cookies);
  return response;
}
