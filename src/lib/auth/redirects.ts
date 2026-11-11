import { ROLE_HOME } from "@/config/nav";
import type { Role } from "@/types";

/** Which roles may open each protected area. */
export const PROTECTED_AREAS: { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/dashboard", roles: ["CUSTOMER"] },
  { prefix: "/courier", roles: ["COURIER"] },
  // ADMIN_VIEWER sees the same pages read-only (lib/auth/permissions.ts).
  { prefix: "/admin", roles: ["ADMIN", "ADMIN_VIEWER"] },
  // Stripe Checkout returns here (/payment/success, /payment/cancel); only customers pay.
  { prefix: "/payment", roles: ["CUSTOMER"] },
  // Any signed-in role: customers apply; the page explains itself to couriers and staff.
  { prefix: "/courier-application", roles: ["CUSTOMER", "COURIER", "ADMIN", "ADMIN_VIEWER"] },
];

const inArea = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** The roles allowed on a path, or null for public paths. */
export function allowedRolesFor(pathname: string): readonly Role[] | null {
  return PROTECTED_AREAS.find((area) => inArea(pathname, area.prefix))?.roles ?? null;
}

/**
 * Accepts only same-origin relative paths ("/dashboard/shipments?page=2").
 * Rejects absolute URLs, protocol-relative "//evil.com", backslash tricks ("/\\evil.com"),
 * control characters and anything that resolves to another origin.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\\]/.test(value)) return null;
  try {
    const base = "http://carrivo.local";
    const url = new URL(value, base);
    if (url.origin !== base) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Where to send a user after login: `next` if it's safe and theirs to open, otherwise their home. */
export function postLoginPath(role: Role, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  if (!safe) return ROLE_HOME[role];
  const pathname = safe.split(/[?#]/)[0];
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/api/") || pathname.startsWith("/auth/")) return ROLE_HOME[role];
  const allowed = allowedRolesFor(pathname);
  if (allowed && !allowed.includes(role)) return ROLE_HOME[role];
  // Email links land on /shipments/:id, which re-routes by role itself.
  return safe;
}

export function loginPath(next?: string | null, extra?: Record<string, string>): string {
  const params = new URLSearchParams(extra);
  const safe = safeNextPath(next);
  if (safe) params.set("next", safe);
  const qs = params.toString();
  return qs ? `/login?${qs}` : "/login";
}
