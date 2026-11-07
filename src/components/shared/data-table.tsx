"use client";

// Client: sorting writes to the URL and rows can navigate on click.
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/types";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** API `sortBy` value; makes the header a sort button. */
  sortKey?: string;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  getRowId: (row: T) => string;
  /** Visually hidden caption describing the table (screen readers). */
  caption: string;
  isLoading?: boolean;
  loadingRows?: number;
  /** Shown when `data` is an empty array. Use <EmptyState variant="plain" />. */
  emptyState: ReactNode;
  /** Sort applied by the API when the URL has none (highlights that column). */
  defaultSort?: { key: string; order: SortOrder };
  /** Whole row navigates here on click (keep a real link in one cell for keyboard users). */
  rowHref?: (row: T) => string;
  /** Card layout below md. Without it, the table scrolls sideways inside its frame. */
  renderMobileCard?: (row: T) => ReactNode;
  className?: string;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

const isInteractive = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && Boolean(target.closest("a, button, input, select, textarea, [role='menuitem']"));

export function DataTable<T>({
  columns,
  data,
  getRowId,
  caption,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  defaultSort,
  rowHref,
  renderMobileCard,
  className,
}: DataTableProps<T>) {
  const router = useRouter();
  const { get, set } = useUrlState();

  const sortBy = get("sortBy") ?? defaultSort?.key;
  const sortOrder: SortOrder = (get("sortOrder") as SortOrder | undefined) ?? defaultSort?.order ?? "desc";

  const toggleSort = (key: string) => {
    const nextOrder: SortOrder = sortBy === key && sortOrder === "desc" ? "asc" : "desc";
    set({ sortBy: key, sortOrder: nextOrder });
  };

  const onRowClick = (row: T) => (event: MouseEvent<HTMLTableRowElement>) => {
    if (!rowHref || isInteractive(event.target)) return;
    router.push(rowHref(row));
  };

  const isEmpty = !isLoading && data !== undefined && data.length === 0;

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border", className)}>
      {isEmpty ? (
        emptyState
      ) : (
        <>
          {renderMobileCard ? (
            <ul className="divide-y divide-border md:hidden" aria-label={caption} aria-busy={isLoading}>
              {isLoading || !data
                ? Array.from({ length: Math.min(loadingRows, 4) }, (_, i) => (
                    <li key={i} className="space-y-2 p-4">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-28 rounded-full" />
                    </li>
                  ))
                : data.map((row) => <li key={getRowId(row)}>{renderMobileCard(row)}</li>)}
            </ul>
          ) : null}

          <div className={cn("overflow-x-auto", renderMobileCard && "hidden md:block")}>
            <Table>
              <caption className="sr-only">{caption}</caption>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface">
                  {columns.map((column) => {
                    const active = column.sortKey !== undefined && sortBy === column.sortKey;
                    const SortIcon = active ? (sortOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <TableHead
                        key={column.id}
                        scope="col"
                        aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                        className={cn("h-11 px-4 text-xs font-semibold text-muted-foreground", alignClass[column.align ?? "left"], column.headerClassName)}
                      >
                        {column.sortKey ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.sortKey as string)}
                            className={cn(
                              "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                              active && "text-foreground",
                            )}
                          >
                            {column.header}
                            <SortIcon className={cn("size-3.5", !active && "opacity-50")} aria-hidden="true" />
                          </button>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody aria-busy={isLoading}>
                {isLoading || !data
                  ? Array.from({ length: loadingRows }, (_, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        {columns.map((column) => (
                          <TableCell key={column.id} className="px-4 py-3.5">
                            <Skeleton className="h-4 w-full max-w-36" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : data.map((row) => (
                      <TableRow
                        key={getRowId(row)}
                        onClick={rowHref ? onRowClick(row) : undefined}
                        className={cn(rowHref && "cursor-pointer")}
                      >
                        {columns.map((column) => (
                          <TableCell key={column.id} className={cn("px-4 py-3.5", alignClass[column.align ?? "left"], column.className)}>
                            {column.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
