"use client";

// Client: page links are built from the current URL (useSearchParams).
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { pageRange } from "@/hooks/use-pagination";
import { useUrlState } from "@/hooks/use-url-state";
import type { PaginationMeta } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaginationProps {
  meta: PaginationMeta;
  /** Noun for the summary line, e.g. "shipments". */
  itemLabel?: string;
  className?: string;
}

const linkBase =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50";

/** Real links (bookmarkable, prefetchable). Render under <Suspense>. */
export function Pagination({ meta, itemLabel = "results", className }: PaginationProps) {
  const { hrefWith } = useUrlState();
  const { page, limit, total, totalPages } = meta;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const hrefFor = (target: number) => hrefWith({ page: target > 1 ? target : null });

  return (
    <nav aria-label="Pagination" className={cn("flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground tabular">
        Showing {formatCount(from)} to {formatCount(to)} of {formatCount(total)} {itemLabel}
      </p>

      {totalPages > 1 ? (
        <ul className="flex items-center gap-1">
          <li>
            {page > 1 ? (
              <Link href={hrefFor(page - 1)} className={cn(linkBase, "hover:bg-muted")} aria-label="Previous page" scroll={false}>
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            ) : (
              <span className={cn(linkBase, "pointer-events-none opacity-40")} aria-hidden="true">
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Previous</span>
              </span>
            )}
          </li>

          {/* Numbers on sm+, "Page x of y" on phones. */}
          <li className="px-2 text-sm font-semibold tabular sm:hidden" aria-current="page">
            Page {page} of {totalPages}
          </li>
          {pageRange(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <li key={`gap-${index}`} className="hidden px-1 text-muted-foreground sm:block" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item} className="hidden sm:block">
                <Link
                  href={hrefFor(item)}
                  scroll={false}
                  aria-current={item === page ? "page" : undefined}
                  aria-label={`Page ${item}`}
                  className={cn(linkBase, "tabular", item === page ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {item}
                </Link>
              </li>
            ),
          )}

          <li>
            {page < totalPages ? (
              <Link href={hrefFor(page + 1)} className={cn(linkBase, "hover:bg-muted")} aria-label="Next page" scroll={false}>
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className={cn(linkBase, "pointer-events-none opacity-40")} aria-hidden="true">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-4" />
              </span>
            )}
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
