import type { NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import { clientIpOf, jsonError, jsonOk } from "@/lib/auth/http";
import { needsRotation, rotateSession } from "@/lib/auth/refresh";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";
import type { UserProfile } from "@/types";

/**
 * GET /api/auth/me → { user } for the client store, or { user: null } when signed out (not an error,
 * so anonymous pages don't log failed requests). Rotates the token first when it's close to expiry
 * (contract §3.5). A dead session clears the cookies and also returns { user: null }.
 */
export async function GET(request: NextRequest) {
  let session = readSession(request.cookies);
  if (!session) return jsonOk({ user: null }, "Not logged in");

  const clientIp = clientIpOf(request);
  let rotated = false;
  if (needsRotation(session)) {
    const next = await rotateSession(session, clientIp);
    if (!next) {
      const response = jsonOk({ user: null }, "Session ended");
      clearSession(response.cookies);
      return response;
    }
    rotated = next.token !== session.token;
    session = next;
  }

  try {
    const { data } = await serverFetch<UserProfile>(endpoints.users.me, { auth: session.token, clientIp });
    const response = jsonOk({ user: data }, "Profile retrieved");
    if (rotated) writeSession(response.cookies, session);
    return response;
  } catch (error) {
    if (ApiError.isApiError(error) && error.isUnauthorized) {
      const response = jsonOk({ user: null }, "Session ended");
      clearSession(response.cookies);
      return response;
    }
    return jsonError(ApiError.isApiError(error) && error.status ? error.status : 502, "Couldn't load your profile. Try again.");
  }
}
