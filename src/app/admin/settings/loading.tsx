import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-11 w-72 rounded-full" />
      <ToolbarSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
