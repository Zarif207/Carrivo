import "server-only";

import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import type { RefreshResult } from "@/types";
import type { Session } from "./session";

/** Rotate when less than this much time is left on the token (contract §3.5). */
export const ROTATE_BEFORE_MS = 24 * 60 * 60 * 1000;

export const needsRotation = (session: Session): boolean => session.expiresAt.getTime() - Date.now() < ROTATE_BEFORE_MS;

/*
 * Single-flight per token on this server instance: parallel requests that all notice the token is
 * near expiry share one POST /auth/refresh-token (which revokes the old token). Entries stay a short
 * while so requests that arrive right after still get the new token instead of a 401.
 */
const inflight = new Map<string, Promise<Session | null>>();
const KEEP_RESULT_MS = 30_000;

/** Returns the rotated session, or null if the API says the token is no longer valid. */
export function rotateSession(session: Session, clientIp: string | false): Promise<Session | null> {
  const existing = inflight.get(session.token);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data } = await serverFetch<RefreshResult>(endpoints.auth.refreshToken, {
        method: "POST",
        auth: session.token,
        clientIp,
      });
      return { token: data.token, role: session.role, expiresAt: new Date(data.expiresAt) };
    } catch (error) {
      if (ApiError.isApiError(error) && error.isUnauthorized) return null;
      // Network/server trouble: keep using the current (still valid) token and try again later.
      return session;
    }
  })();

  inflight.set(session.token, promise);
  setTimeout(() => inflight.delete(session.token), KEEP_RESULT_MS).unref?.();
  return promise;
}
