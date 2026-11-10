import type { Role } from "@/types";

/*
 * Who may do what in the admin area. Plain module: shared by the proxy, Server Components,
 * route handlers (the BFF) and client components.
 *
 * ADMIN_VIEWER is a read-only admin: it sees everything ADMIN sees under /admin and can change
 * nothing. The API enforces that (403 "This account is read-only"); the UI hides write controls
 * and the BFF refuses the writes before they reach the API.
 */

/** Roles that may open /admin. */
export const STAFF_ROLES = ["ADMIN", "ADMIN_VIEWER"] as const satisfies readonly Role[];

export const isStaff = (role: Role | null | undefined): boolean => role === "ADMIN" || role === "ADMIN_VIEWER";

/** Read-only accounts: every write is refused (logout, token refresh and their own notification read state excepted). */
export const isReadOnly = (role: Role | null | undefined): boolean => role === "ADMIN_VIEWER";

/**
 * The only API writes a read-only account may make through the BFF: marking its OWN
 * notifications read (read state, not a business write). Mirrors the API's rule
 * (READ_ONLY_ALLOWED_PATTERNS); DELETE /notifications/:id stays refused.
 * `path` is the API path without /api/v1, e.g. "/notifications/<id>/read".
 */
const READ_ONLY_ALLOWED_WRITES: readonly { method: string; pattern: RegExp }[] = [
  { method: "PATCH", pattern: /^\/notifications\/read-all$/ },
  { method: "PATCH", pattern: /^\/notifications\/[0-9a-fA-F-]{36}\/read$/ },
];

export const readOnlyMayWrite = (method: string, path: string): boolean =>
  READ_ONLY_ALLOWED_WRITES.some((rule) => rule.method === method.toUpperCase() && rule.pattern.test(path));

/** May mark own notifications read: every signed-in role, the viewer included. */
export const canMarkNotificationsRead = (role: Role | null | undefined): boolean => role != null;

/** May delete own notifications: every role except the read-only viewer (the API answers 403). */
export const canDeleteNotifications = (role: Role | null | undefined): boolean => role != null && !isReadOnly(role);

/** May change things in the admin area (create, edit, delete, assign, status steps, refunds, users). Only ADMIN. */
export const canMutate = (role: Role | null | undefined): boolean => role === "ADMIN";

/** Shown wherever a write is refused for a read-only account. */
export const READ_ONLY_MESSAGE = "View-only access: this account can look at everything but can't make changes.";
