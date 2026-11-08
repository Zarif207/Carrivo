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

/** Read-only accounts: every write is refused (logout and token refresh excepted). */
export const isReadOnly = (role: Role | null | undefined): boolean => role === "ADMIN_VIEWER";

/** May change things in the admin area (create, edit, delete, assign, status steps, refunds, users). Only ADMIN. */
export const canMutate = (role: Role | null | undefined): boolean => role === "ADMIN";

/** Shown wherever a write is refused for a read-only account. */
export const READ_ONLY_MESSAGE = "View-only access: this account can look at everything but can't make changes.";
