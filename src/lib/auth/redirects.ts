import { ROLE_HOME } from "@/config/nav";
import type { Role } from "@/types";

/** Which role owns each protected area. */
export const PROTECTED_AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/dashboard", role: "CUSTOMER" },
  { prefix: "/courier", role: "COURIER" },
  { prefix: "/admin", role: "ADMIN" },
];

const inArea = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** The role a path requires, or null for public paths. */
export function requiredRoleFor(pathname: string): Role | null {
  return PROTECTED_AREAS.find((area) => inArea(pathname, area.prefix))?.role ?? null;
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
  const required = requiredRoleFor(pathname);
  if (required && required !== role) return ROLE_HOME[role];
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
