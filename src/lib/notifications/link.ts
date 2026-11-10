/*
 * Notification links come from the API ("link": an in-app path). They are data, so the UI only
 * ever navigates to a same-origin path: anything else (absolute URLs, protocol-relative "//host",
 * backslash tricks, javascript:, control characters) is ignored and the click just marks the
 * notification read. Plain module (no imports): used by client components and unit-tested directly.
 */

/** Any origin works: it only has to be one an attacker can't name. */
const PROBE_ORIGIN = "https://carrivo.invalid";
const MAX_LENGTH = 2048;

/**
 * The link as a safe in-app path ("/admin/shipments/123?x=1#y"), or null when it must not be followed.
 */
export function safeInternalPath(link: unknown): string | null {
  if (typeof link !== "string") return null;
  const value = link.trim();
  if (value.length === 0 || value.length > MAX_LENGTH) return null;
  // Must be root-relative. "//evil.com" and "/\evil.com" are read as other hosts by browsers.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  // Control characters and whitespace inside a URL are never legitimate here (and hide tricks like "/\t/evil").
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Where clicking a notification goes: its safe link, or nowhere (null = just mark it read). */
export function notificationHref(notification: { link?: string | null }): string | null {
  return safeInternalPath(notification.link ?? null);
}
