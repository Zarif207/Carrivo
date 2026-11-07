import "server-only";

/** Headers the BFF adds so the API can rate-limit per real visitor instead of per Vercel server. */
export const BFF_HEADERS = {
  clientIp: "x-client-ip",
  secret: "x-bff-secret",
} as const;

const IP_PATTERN = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * The visitor's IP as seen by our own host. On Vercel `x-real-ip` / the first `x-forwarded-for`
 * entry is set by the platform, so the browser can't spoof it.
 */
export function getClientIp(headers: Headers): string | undefined {
  const candidates = [headers.get("x-real-ip"), headers.get("x-forwarded-for")?.split(",")[0]];
  for (const raw of candidates) {
    const ip = raw?.trim();
    if (ip && IP_PATTERN.test(ip)) return ip;
  }
  return undefined;
}

/** Adds x-bff-secret (+ x-client-ip when known). No-op until BFF_SHARED_SECRET is set. */
export function applyBffHeaders(target: Headers, clientIp: string | undefined): void {
  const secret = process.env.BFF_SHARED_SECRET;
  if (!secret) return;
  target.set(BFF_HEADERS.secret, secret);
  if (clientIp) target.set(BFF_HEADERS.clientIp, clientIp);
}
