import "server-only";

import { cookies } from "next/headers";
import { API_TIMEOUT_MS, AUTH_COOKIES, getApiBaseUrl } from "./config";
import { ApiError } from "./errors";
import { toQueryString } from "./search-params";
import type { ApiSuccess, Paginated } from "./types";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ServerFetchOptions {
  method?: HttpMethod;
  /** Plain objects are sent as JSON; FormData is sent as multipart (proof upload). */
  body?: object | FormData;
  /** Typed query object; empty values are dropped. */
  query?: object;
  /**
   * Which token to send:
   * - `true` (default): the session cookie, if present (calling `cookies()` makes the route dynamic).
   * - `false`: no token and no cookie read, for public endpoints on static pages.
   * - a string: this exact token (route handlers that just received or rotated one).
   */
  auth?: boolean | string;
  /** Throw 401 locally instead of calling the API when no token is available. */
  requireAuth?: boolean;
  headers?: HeadersInit;
  /** Next.js fetch caching. Authenticated calls default to `no-store`. */
  cache?: RequestCache;
  next?: RequestInit["next"];
  signal?: AbortSignal;
  timeoutMs?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function resolveToken(auth: ServerFetchOptions["auth"]): Promise<string | undefined> {
  if (typeof auth === "string") return auth || undefined;
  if (auth === false) return undefined;
  const store = await cookies();
  return store.get(AUTH_COOKIES.token)?.value || undefined;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Calls the Carrivo API from the server (Server Components, Route Handlers, Server Actions)
 * and returns the success envelope. Any failure is thrown as an `ApiError`:
 * HTTP errors with the API's message and field errors, status 0 for network errors/timeouts.
 *
 * @example
 * const { data, meta } = await serverFetch<ShipmentListItem[]>(endpoints.shipments.list, { query: { page: 1 } });
 */
export async function serverFetch<T>(path: string, options: ServerFetchOptions = {}): Promise<ApiSuccess<T>> {
  const { method = "GET", body, query, auth = true, requireAuth = false, timeoutMs = API_TIMEOUT_MS } = options;

  const token = await resolveToken(auth);
  if (requireAuth && !token) {
    throw new ApiError(401, "Authentication token is missing");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // fetch sets the multipart boundary itself
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: payload,
      signal,
      cache: options.cache ?? (token || method !== "GET" ? "no-store" : undefined),
      next: options.next,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ApiError(0, timedOut ? "The server took too long to respond. Please try again." : "Could not reach the server. Check your connection and try again.");
  }

  const parsed = await readBody(response);

  if (!response.ok || (isRecord(parsed) && parsed.success === false)) {
    throw ApiError.fromBody(response.status, parsed);
  }

  if (isRecord(parsed) && parsed.success === true) {
    return parsed as unknown as ApiSuccess<T>;
  }

  // Non-envelope success (Better Auth's /auth/change-password): wrap it so callers see one shape.
  return { success: true, message: "", data: parsed as T };
}

/** For list endpoints: returns `{ data, meta }` and fails loudly if the API sent no meta. */
export async function serverFetchList<T>(path: string, options: ServerFetchOptions = {}): Promise<Paginated<T>> {
  const result = await serverFetch<T[]>(path, options);
  if (!result.meta) {
    throw new ApiError(500, `Expected pagination meta from ${path}`);
  }
  return { data: result.data, meta: result.meta };
}
