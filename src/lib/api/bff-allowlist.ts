/*
 * Every API call the browser may make through /api/bff/*, taken from docs/API_CONTRACT.md §4-8.
 * Anything not listed (the Stripe webhook, other /auth/* routes, unknown paths) is refused with 404.
 * Sign-in, sign-up, logout and refresh go through /api/auth/* instead.
 */

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface Rule {
  method: Method;
  pattern: RegExp;
  /** Callable without a session (the token is still attached when there is one). */
  public?: boolean;
}

const ID = "[0-9a-fA-F-]{36}";
const TRACKING = "[A-Za-z0-9-]{1,32}";
const r = (method: Method, path: string, isPublic = false): Rule => ({ method, pattern: new RegExp(`^${path}$`), public: isPublic });

export const BFF_RULES: readonly Rule[] = [
  // Users
  r("GET", "/users/me"),
  r("PATCH", "/users/me"),
  // POST /auth/change-password is NOT proxied: its raw response can carry a session token.
  // It goes through /api/auth/change-password, which strips it.

  // Zones, hubs, pricing (reads public; writes admin, enforced by the API)
  r("GET", "/zones", true),
  r("GET", `/zones/${ID}`, true),
  r("POST", "/zones"),
  r("PATCH", `/zones/${ID}`),
  r("DELETE", `/zones/${ID}`),
  r("GET", "/hubs", true),
  r("GET", `/hubs/${ID}`, true),
  r("POST", "/hubs"),
  r("PATCH", `/hubs/${ID}`),
  r("DELETE", `/hubs/${ID}`),
  r("POST", "/pricing/estimate", true),
  r("GET", "/pricing"),
  r("POST", "/pricing"),
  r("GET", `/pricing/${ID}`),
  r("PATCH", `/pricing/${ID}`),
  r("DELETE", `/pricing/${ID}`),

  // Shipments
  r("GET", "/shipments"),
  r("POST", "/shipments"),
  r("GET", `/shipments/${ID}`),
  r("PATCH", `/shipments/${ID}`),
  r("DELETE", `/shipments/${ID}`),
  r("POST", `/shipments/${ID}/(cancel|pickup|assign|unassign|proof)`),
  r("PATCH", `/shipments/${ID}/status`),
  r("GET", `/tracking/${TRACKING}`, true),

  // Couriers
  r("GET", "/couriers"),
  r("GET", "/couriers/me/tasks"),
  r("GET", "/couriers/me/earnings"),
  r("PATCH", "/couriers/me/availability"),

  // Payments
  r("POST", "/payments/initiate"),
  r("GET", "/payments/verify"),
  r("GET", "/payments/my"),
  r("GET", `/payments/${ID}`),

  // Courier applications (apply/cancel: CUSTOMER; my: CUSTOMER, COURIER; enforced by the API)
  r("POST", "/courier-applications"),
  r("GET", "/courier-applications/my"),
  r("PATCH", `/courier-applications/my/${ID}/cancel`),

  // Admin
  r("GET", "/admin/users"),
  r("POST", "/admin/users"),
  r("PATCH", `/admin/users/${ID}/(role|status)`),
  r("GET", "/admin/dashboard-stats"),
  r("GET", "/admin/audit-logs"),
  r("GET", "/admin/payments"),
  r("POST", `/admin/payments/${ID}/refund`),
  r("GET", "/admin/courier-applications"),
  r("GET", `/admin/courier-applications/${ID}`),
  r("PATCH", `/admin/courier-applications/${ID}/(approve|reject)`),

  // Notifications
  r("GET", "/notifications/my"),
  r("GET", "/notifications/unread-count"),
  r("PATCH", "/notifications/read-all"),
  r("PATCH", `/notifications/${ID}/read`),
  r("DELETE", `/notifications/${ID}`),
];

/** The matching rule, or null when the call is not allowed. */
export function matchBffRule(method: string, path: string): Rule | null {
  return BFF_RULES.find((rule) => rule.method === method && rule.pattern.test(path)) ?? null;
}
