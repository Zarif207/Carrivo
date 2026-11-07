/**
 * Client-safe API exports. The server-only fetch helper is imported directly
 * from "@/lib/api/server" so it can never end up in a client bundle.
 */
export * from "./types";
export { ApiError } from "./errors";
export { endpoints } from "./endpoints";
export { queryKeys } from "./query-keys";
export { toQueryString } from "./search-params";
export { AUTH_COOKIES, MAX_PAGE_LIMIT, PROOF_MAX_BYTES, PROOF_MIME_TYPES } from "./config";
