import { Skeleton } from "@/components/ui/skeleton";

export function TrackingResultSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start" aria-hidden="true">
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
        <div className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <Skeleton className="h-6 w-28" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-5 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
