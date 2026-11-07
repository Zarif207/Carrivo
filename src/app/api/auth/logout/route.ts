import type { NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { checkOrigin, clientIpOf, jsonOk } from "@/lib/auth/http";
import { clearSession, readSession } from "@/lib/auth/session";

/** POST /api/auth/logout: revokes the API session (best effort) and always clears the cookies. */
export async function POST(request: NextRequest) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;

  const session = readSession(request.cookies);
  if (session) {
    try {
      await serverFetch(endpoints.auth.logout, { method: "POST", auth: session.token, clientIp: clientIpOf(request) });
    } catch {
      // Already revoked or the API is unreachable: the cookies are cleared either way.
    }
  }

  const response = jsonOk(null, "Logged out");
  clearSession(response.cookies);
  return response;
}
