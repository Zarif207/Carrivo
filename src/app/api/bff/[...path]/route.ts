import { NextResponse, type NextRequest } from "next/server";
import { applyBffHeaders } from "@/lib/api/client-ip";
import { getApiBaseUrl } from "@/lib/api/config";
import { matchBffRule } from "@/lib/api/bff-allowlist";
import { checkOrigin, clientIpOf, jsonError } from "@/lib/auth/http";
import { READ_ONLY_MESSAGE, isReadOnly, readOnlyMayWrite } from "@/lib/auth/permissions";
import { needsRotation, rotateSession } from "@/lib/auth/refresh";
import { clearSession, readSession, writeSession, type Session } from "@/lib/auth/session";

/*
 * Same-origin proxy for client components: /api/bff/<api path> → API_BASE_URL/<api path>.
 * - only allow-listed method + path pairs (lib/api/bff-allowlist.ts);
 * - attaches the Bearer token from the httpOnly cookie, plus x-client-ip and x-bff-secret;
 * - rotates the token before it expires (single-flight, contract §3.5);
 * - streams request bodies (multipart uploads) and responses through unchanged, status included;
 * - refuses every write from a read-only session (ADMIN_VIEWER) with 403 READ_ONLY, before the API
 *   is called (the API refuses them too; the role comes from the HMAC-signed cookie, so it can't be forged),
 *   except marking its own notifications read (readOnlyMayWrite, same rule as the API).
 * A 401 from the API is passed back with code SESSION_EXPIRED; the client then calls
 * /api/auth/refresh once and retries, and logs out if that fails (lib/api/client.ts).
 */

type Context = { params: Promise<{ path: string[] }> };

const FORWARDED_REQUEST_HEADERS = ["content-type", "content-length", "accept"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-length", "ratelimit", "ratelimit-policy", "retry-after"];
const API_TIMEOUT_MS = 30_000;

async function handle(request: NextRequest, { params }: Context): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const blocked = checkOrigin(request);
    if (blocked) return blocked;
  }

  const segments = (await params).path ?? [];
  if (segments.some((s) => s === "." || s === ".." || s.includes("/") || s.includes("\\"))) {
    return jsonError(404, "Not found", [], "NOT_ALLOWED");
  }
  const path = `/${segments.map(encodeURIComponent).join("/")}`;
  const rule = matchBffRule(method, path);
  if (!rule) return jsonError(404, "Not found", [], "NOT_ALLOWED");

  let session: Session | null = readSession(request.cookies, Date.now());
  if (!session && !rule.public) return jsonError(401, "You're not logged in.", [], "UNAUTHENTICATED");
  if (session && isReadOnly(session.role) && method !== "GET" && method !== "HEAD" && !readOnlyMayWrite(method, path)) {
    return jsonError(403, READ_ONLY_MESSAGE, [], "READ_ONLY");
  }

  const clientIp = clientIpOf(request);
  let rotated = false;
  if (session && needsRotation(session)) {
    const next = await rotateSession(session, clientIp);
    if (!next) {
      const response = jsonError(401, "Your session ended. Log in again.", [], "SESSION_EXPIRED");
      clearSession(response.cookies);
      return response;
    }
    rotated = next.token !== session.token;
    session = next;
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (session) headers.set("authorization", `Bearer ${session.token}`);
  applyBffHeaders(headers, clientIp || undefined);

  const hasBody = method !== "GET" && method !== "HEAD" && request.body !== null;
  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}${path}${request.nextUrl.search}`, {
      method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required by Node's fetch to stream a request body (multipart uploads go straight through).
      ...(hasBody ? { duplex: "half" } : {}),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    } as RequestInit & { duplex?: "half" });
  } catch {
    return jsonError(502, "Could not reach the server. Check your connection and try again.");
  }

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  if (upstream.status === 401 && session) {
    // Don't clear cookies here: another request may have just rotated them. The client decides.
    await upstream.body?.cancel();
    return jsonError(401, "Your session ended. Log in again.", [], "SESSION_EXPIRED");
  }

  const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  if (rotated && session) writeSession(response.cookies, session);
  return response;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
