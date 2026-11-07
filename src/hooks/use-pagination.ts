"use client";

import { useMemo } from "react";
import { MAX_PAGE_LIMIT } from "@/lib/api/config";
import { useUrlState } from "./use-url-state";

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

/** Reads `page` and `limit` from the URL (clamped to what the API accepts). */
export function usePagination(defaultLimit = 10) {
  const { get, set } = useUrlState();
  const page = toPositiveInt(get("page"), 1);
  const limit = Math.min(toPositiveInt(get("limit"), defaultLimit), MAX_PAGE_LIMIT);

  return useMemo(
    () => ({
      page,
      limit,
      setPage: (next: number) => set({ page: next > 1 ? next : null }, { resetPage: false, push: true }),
      setLimit: (next: number) => set({ limit: next === defaultLimit ? null : next }),
    }),
    [page, limit, set, defaultLimit],
  );
}

export type PageRange = (number | "gap")[];

/** 1 … 4 5 6 … 12 */
export function pageRange(current: number, total: number, siblings = 1): PageRange {
  if (total <= 5 + siblings * 2) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);
  const range: PageRange = [1];
  if (start > 2) range.push("gap");
  for (let i = start; i <= end; i += 1) range.push(i);
  if (end < total - 1) range.push("gap");
  range.push(total);
  return range;
}
