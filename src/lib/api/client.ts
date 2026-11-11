"use client";

import { toast } from "sonner";
import { currentSessionEndReason } from "@/lib/auth/role-change-hint";
import { SESSION_END_MESSAGES, sessionEndLoginUrl, type SessionEndReason } from "@/lib/auth/session-end";
import { ApiError } from "./errors";
import { toQueryString } from "./search-params";
import type { ApiSuccess, Paginated } from "./types";

/*
 * Browser-side API calls. Everything goes through the same-origin BFF (/api/bff/*), which holds the
 * token in an httpOnly cookie. Session handling (contract §3.5):
 *   BFF 401 → one shared POST /api/auth/refresh for all parallel 401s → retry once →
 *   still 401 (or refresh failed) → POST /api/auth/logout, toast, redirect to /login?next=<here>.
 */

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export interface ClientFetchOptions {
  method?: Method;
  body?: object | FormData;
  query?: object;
  signal?: AbortSignal;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

let refreshInFlight: Promise<boolean> | null = null;
let sessionEnding = false;

/** One refresh attempt shared by every request that got a 401 at the same time. */
function recoverSession(): Promise<boolean> {
  refreshInFlight ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => {
        refreshInFlight = null;
      }, 1000);
    });
  return refreshInFlight;
}

/**
 * Clears the cookies, tells the user once, and sends them to log in again. The reason defaults to
 * what the browser can tell: "role-changed" while a courier application was pending (its approval
 * revokes every session), otherwise "expired". Never loops: /login is not protected, the cookies are
 * gone, and `next` never points back at /login (sessionEndLoginUrl).
 */
export function endSession(reason: SessionEndReason = currentSessionEndReason()): void {
  if (sessionEnding || typeof window === "undefined") return;
  sessionEnding = true;
  toast.error(SESSION_END_MESSAGES[reason]);
  const target = new URL(sessionEndLoginUrl(window.location.pathname, window.location.search, reason), window.location.origin).toString();
  void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    .catch(() => undefined)
    // A full navigation on purpose: it drops every piece of client state from the ended session.
    .finally(() => window.location.assign(target));
}

async function send(path: string, options: ClientFetchOptions): Promise<Response> {
  const { method = "GET", body, query, signal } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  try {
    return await fetch(`/api/bff${path}${toQueryString(query)}`, { method, headers, body: payload, signal, credentials: "same-origin" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }
}

async function parse<T>(response: Response): Promise<ApiSuccess<T>> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || (isRecord(body) && body.success === false)) throw ApiError.fromBody(response.status, body);
  if (isRecord(body) && body.success === true) return body as unknown as ApiSuccess<T>;
  return { success: true, message: "", data: body as T };
}

/** Calls the API through the BFF and returns the success envelope; throws ApiError otherwise. */
export async function apiFetch<T>(path: string, options: ClientFetchOptions = {}): Promise<ApiSuccess<T>> {
  let response = await send(path, options);
  if (response.status === 401) {
    // Read before the refresh attempt: a failed refresh clears the cookies, the role-change hint included.
    const reason = currentSessionEndReason();
    const recovered = await recoverSession();
    if (recovered) response = await send(path, options);
    if (!recovered || response.status === 401) {
      endSession(reason);
      throw new ApiError(401, SESSION_END_MESSAGES[reason]);
    }
  }
  return parse<T>(response);
}

/** For list endpoints: `{ data, meta }`. */
export async function apiFetchList<T>(path: string, options: ClientFetchOptions = {}): Promise<Paginated<T>> {
  const result = await apiFetch<T[]>(path, options);
  if (!result.meta) throw new ApiError(500, `Expected pagination meta from ${path}`);
  return { data: result.data, meta: result.meta };
}
