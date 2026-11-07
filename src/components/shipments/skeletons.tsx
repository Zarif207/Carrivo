import { StatCardSkeleton } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

/** Same footprint as ShipmentsTable (rows) so streaming in doesn't shift the page. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border" aria-busy="true" aria-label="Loading">
      <div className="h-11 bg-surface" />
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="hidden h-4 flex-1 md:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="ml-auto h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:flex-row" aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-full md:max-w-sm" />
      <div className="grid grid-cols-2 gap-3 md:flex">
        <Skeleton className="h-10 rounded-md md:w-48" />
        <Skeleton className="h-10 rounded-md md:w-40" />
      </div>
    </div>
  );
}
