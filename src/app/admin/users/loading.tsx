import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <ToolbarSkeleton />
      <TableSkeleton />
    </div>
  );
}
