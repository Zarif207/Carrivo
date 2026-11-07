import type { NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import { checkOrigin, clientIpOf, jsonError, jsonOk } from "@/lib/auth/http";
import { needsRotation, rotateSession } from "@/lib/auth/refresh";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

/**
 * POST /api/auth/refresh: called once by the client after a BFF 401 (shared by parallel 401s).
 * It succeeds only if the session in the cookie is still valid (e.g. another request already rotated
 * it); then the client retries once. Otherwise it clears the cookies and returns 401.
 */
export async function POST(request: NextRequest) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;

  const ended = () => {
    const response = jsonError(401, "Your session ended. Log in again.", [], "SESSION_EXPIRED");
    clearSession(response.cookies);
    return response;
  };

  let session = readSession(request.cookies, Date.now());
  if (!session) return ended();

  const clientIp = clientIpOf(request);
  let rotated = false;
  if (needsRotation(session)) {
    const next = await rotateSession(session, clientIp);
    if (!next) return ended();
    rotated = next.token !== session.token;
    session = next;
  }

  try {
    await serverFetch(endpoints.users.me, { auth: session.token, clientIp });
  } catch (error) {
    if (ApiError.isApiError(error) && error.isUnauthorized) return ended();
    return jsonError(502, "Couldn't check your session. Try again.");
  }

  const response = jsonOk({ ok: true }, "Session is valid");
  if (rotated) writeSession(response.cookies, session);
  return response;
}
