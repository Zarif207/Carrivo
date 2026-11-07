import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME } from "@/config/nav";
import { loginPath, postLoginPath, requiredRoleFor } from "@/lib/auth/redirects";
import { readSession } from "@/lib/auth/session";

/*
 * Next 16 proxy (formerly middleware). Optimistic, cookie-only routing: it never calls the API.
 * The role comes from the HMAC-signed role cookie (lib/auth/session.ts); dashboard layouts
 * re-verify the user against the API with requireRole().
 */

const AUTH_PAGES = new Set(["/login", "/register"]);

function noStore(response: NextResponse): NextResponse {
  // Protected pages must never come back from the HTTP cache after logout.
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = readSession(request.cookies, Date.now());

  if (AUTH_PAGES.has(pathname)) {
    if (!session) return NextResponse.next();
    const target = postLoginPath(session.role, request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(target, request.url));
  }

  const required = requiredRoleFor(pathname);
  if (!required) return NextResponse.next();

  if (!session) {
    return noStore(NextResponse.redirect(new URL(loginPath(`${pathname}${search}`), request.url)));
  }
  if (session.role !== required) {
    return noStore(NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url)));
  }
  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/courier/:path*", "/admin/:path*", "/payment/:path*", "/login", "/register"],
};
