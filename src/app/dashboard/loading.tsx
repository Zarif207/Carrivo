import { StatsSkeleton, TableSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-11 w-80 max-w-full rounded-full" />
      <StatsSkeleton />
      <TableSkeleton rows={5} />
    </div>
  );
}
