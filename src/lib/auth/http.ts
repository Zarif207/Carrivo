import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/api/client-ip";
import type { ApiErrorDetail } from "@/lib/api/types";

/** Same envelope as the API, so the client parses one shape everywhere. */
export function jsonError(status: number, message: string, errors: ApiErrorDetail[] = [], code?: string): NextResponse {
  return NextResponse.json({ success: false, message, errors, ...(code ? { code } : {}) }, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonOk<T>(data: T, message = "OK", status = 200): NextResponse {
  return NextResponse.json({ success: true, message, data }, { status, headers: { "Cache-Control": "no-store" } });
}

function allowedOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return null;
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/**
 * CSRF guard for mutating requests: the Origin header must equal NEXT_PUBLIC_APP_URL's origin.
 * Returns an error response to send, or null when the request may continue.
 */
export function checkOrigin(request: NextRequest): NextResponse | null {
  const expected = allowedOrigin();
  if (!expected) return jsonError(500, "NEXT_PUBLIC_APP_URL is not configured on the server.");
  const origin = request.headers.get("origin");
  if (origin !== expected) return jsonError(403, "This request must come from the Carrivo site.", [], "BAD_ORIGIN");
  return null;
}

export const clientIpOf = (request: NextRequest): string | false => getClientIp(request.headers) ?? false;

/** Reads a JSON body without throwing (invalid JSON → undefined, which validation then rejects). */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
