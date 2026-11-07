import type { SortOrder } from "@/types";

/** Raw `searchParams` as Next passes them to pages. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const firstParam = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const positiveInt = (value: string | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER): number => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
};

/** Keeps a param only when it's one of `allowed` (anything else is ignored, never sent to the API). */
export function pickEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/**
 * page / limit / sortBy / sortOrder / searchTerm from the URL, validated against the API's rules
 * (limit ≤ 100, whitelisted sortBy, search 1-100 chars), so a hand-edited URL can't cause a 400.
 */
export function parseListParams<TSort extends string>(
  params: RawSearchParams,
  { sortFields, defaultSort, defaultLimit = 10 }: { sortFields: readonly TSort[]; defaultSort: NoInfer<TSort>; defaultLimit?: number },
): { page: number; limit: number; sortBy: TSort; sortOrder: SortOrder; searchTerm: string | undefined } {
  const searchTerm = firstParam(params.searchTerm)?.trim().slice(0, 100);
  return {
    page: positiveInt(firstParam(params.page), 1),
    limit: positiveInt(firstParam(params.limit), defaultLimit, 100),
    sortBy: pickEnum<TSort>(firstParam(params.sortBy), sortFields) ?? defaultSort,
    sortOrder: (pickEnum(firstParam(params.sortOrder), ["asc", "desc"] as const) ?? "desc") as SortOrder,
    searchTerm: searchTerm ? searchTerm : undefined,
  };
}

/** A YYYY-MM-DD date filter from the URL (the format every API date filter accepts), or undefined. */
export function pickDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? undefined : value;
}
