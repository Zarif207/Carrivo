import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { serverFetch, type ServerFetchOptions } from "@/lib/api/server";
import type { ApiSuccess, Paginated } from "@/lib/api/types";

/**
 * Authenticated reads for signed-in pages (Server Components). Request-time only: it awaits
 * connection() before touching cookies, as CLAUDE.md requires. A 401 means the session died after
 * the layout checked it, so the user goes through /api/auth/session-expired (clears cookies).
 */
export async function sessionFetch<T>(path: string, options: Omit<ServerFetchOptions, "auth" | "requireAuth"> = {}): Promise<ApiSuccess<T>> {
  await connection();
  let result: ApiSuccess<T>;
  try {
    result = await serverFetch<T>(path, { ...options, auth: true, requireAuth: true });
  } catch (error) {
    if (ApiError.isApiError(error) && error.isUnauthorized) redirect("/api/auth/session-expired?reason=expired");
    throw error;
  }
  return result;
}

export async function sessionFetchList<T>(path: string, options: Omit<ServerFetchOptions, "auth" | "requireAuth"> = {}): Promise<Paginated<T>> {
  const result = await sessionFetch<T[]>(path, options);
  if (!result.meta) throw new ApiError(500, `Expected pagination meta from ${path}`);
  return { data: result.data, meta: result.meta };
}

/** `meta.total` for a filtered list, fetched with limit=1 (one small request per count). */
export async function sessionCount(path: string, query: object = {}): Promise<number> {
  const { meta } = await sessionFetchList<unknown>(path, { query: { ...query, limit: 1 } });
  return meta.total;
}
