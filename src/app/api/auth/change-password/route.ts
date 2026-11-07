import type { NextRequest } from "next/server";
import { z } from "zod";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import { checkOrigin, clientIpOf, jsonError, jsonOk, readJson } from "@/lib/auth/http";
import { readSession, writeSession } from "@/lib/auth/session";
import type { ChangePasswordResult } from "@/types";

const bodySchema = z.strictObject({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  revokeOtherSessions: z.boolean().optional(),
});

/**
 * POST /api/auth/change-password. Better Auth answers with its own shape { token, user } (not the
 * usual envelope, contract §3.7), and `token` may be a fresh session token. It must never reach the
 * browser, so this handler strips it (and moves the cookie to it when one is issued) and returns
 * the standard envelope.
 */
export async function POST(request: NextRequest) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;

  const session = readSession(request.cookies, Date.now());
  if (!session) return jsonError(401, "You're not logged in.", [], "UNAUTHENTICATED");

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "Validation failed", parsed.error.issues.map((i) => ({ path: `body.${i.path.join(".")}`, message: i.message })));
  }

  try {
    const { data } = await serverFetch<ChangePasswordResult>(endpoints.auth.changePassword, {
      method: "POST",
      auth: session.token,
      clientIp: clientIpOf(request),
      body: parsed.data,
    });
    const response = jsonOk({ changed: true }, "Password changed");
    if (data && typeof data.token === "string" && data.token) {
      // Better Auth rotated the session: keep the user signed in on the new token. The API doesn't
      // return an expiry here, so keep the current one (the BFF rotates before it anyway).
      writeSession(response.cookies, { ...session, token: data.token });
    }
    return response;
  } catch (error) {
    if (ApiError.isApiError(error)) {
      // Better Auth reports a wrong current password as 400 INVALID_PASSWORD.
      if (error.status === 400 && /invalid password/i.test(error.message)) {
        return jsonError(400, "Your current password is incorrect.", [{ path: "body.currentPassword", message: "Current password is incorrect" }]);
      }
      return jsonError(error.status || 502, error.message, error.errors);
    }
    return jsonError(500, "Couldn't change your password. Try again.");
  }
}
