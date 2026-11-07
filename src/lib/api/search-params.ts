type QueryValue = string | number | boolean | null | undefined;

const isQueryValue = (value: unknown): value is QueryValue =>
  value === null ||
  value === undefined ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

/**
 * Turns a typed query object into a query string ("" or "?a=1&b=2").
 * Skips undefined, null and empty strings (the API treats `?key=` as "not provided" anyway),
 * and sorts keys so equal queries produce equal URLs.
 */
export function toQueryString(query: object | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query).sort(([a], [b]) => a.localeCompare(b))) {
    if (!isQueryValue(value) || value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
