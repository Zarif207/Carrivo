import { StatCardSkeleton } from "@/components/shared/stat-card";
import { TableSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function EarningsLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-11 w-80 max-w-full rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <TableSkeleton />
    </div>
  );
}
