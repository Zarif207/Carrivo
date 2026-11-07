import { Skeleton } from "@/components/ui/skeleton";

export function ShipmentDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
