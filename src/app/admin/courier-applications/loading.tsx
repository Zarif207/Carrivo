import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCourierApplicationsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-72" />
      <ToolbarSkeleton />
      <Skeleton className="h-11 w-full max-w-md rounded-full" />
      <TableSkeleton />
    </div>
  );
}
