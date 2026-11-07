import "server-only";

import type { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import type { AuthResult, User } from "@/types";
import { jsonError, jsonOk } from "./http";
import { postLoginPath } from "./redirects";
import { SessionConfigError, assertSessionConfigured, writeSession } from "./session";

/** What the browser gets after any sign-in: the safe profile and where to go. Never the token. */
export interface SignedInPayload {
  user: User;
  redirectTo: string;
}

export function signedInResponse(result: AuthResult, next: string | null | undefined, message: string, status = 200): NextResponse {
  const redirectTo = postLoginPath(result.user.role, next);
  const response = jsonOk<SignedInPayload>({ user: result.user, redirectTo }, message, status);
  writeSession(response.cookies, { token: result.token, role: result.user.role, expiresAt: new Date(result.expiresAt) });
  return response;
}

/** Turns API and config errors into the shared envelope. */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof SessionConfigError) return jsonError(500, "Sign-in isn't configured on this server yet (SESSION_SECRET is missing).");
  if (ApiError.isApiError(error)) {
    if (error.isNetworkError) return jsonError(502, error.message);
    return jsonError(error.status, error.message, error.errors);
  }
  return jsonError(500, "Something went wrong while signing you in. Try again.");
}

export { assertSessionConfigured };
