"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type UrlUpdates = Record<string, string | number | null | undefined>;

interface SetOptions {
  /** Drop `page` so filters always start from page 1 (default true). */
  resetPage?: boolean;
  /** Add a history entry instead of replacing the current one (default false). */
  push?: boolean;
}

/** Builds "?a=1&b=2" from the current params plus updates (null/undefined/"" removes a key). */
export function buildSearch(current: URLSearchParams, updates: UrlUpdates, resetPage = true): string {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  if (resetPage && !("page" in updates)) params.delete("page");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Filters, search, sort and pagination live in the URL so every list is bookmarkable.
 * Must render under <Suspense> (useSearchParams, Cache Components).
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback((key: string): string | undefined => searchParams.get(key) ?? undefined, [searchParams]);

  const set = useCallback(
    (updates: UrlUpdates, { resetPage = true, push = false }: SetOptions = {}) => {
      const url = `${pathname}${buildSearch(searchParams, updates, resetPage)}`;
      if (push) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** href for a link that applies `updates` (used by Pagination so pages are real links). */
  const hrefWith = useCallback(
    (updates: UrlUpdates, resetPage = false) => `${pathname}${buildSearch(searchParams, updates, resetPage)}`,
    [pathname, searchParams],
  );

  return { searchParams, get, set, hrefWith };
}
