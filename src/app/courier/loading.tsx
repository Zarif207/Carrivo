import { StatsSkeleton, TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourierLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <StatsSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <ToolbarSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}
