import { Skeleton } from "@/components/ui/skeleton";

/** Same footprint as the page (main card + side panel), so nothing jumps when it loads. */
export function ApplicationSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-hidden="true">
      <div className="space-y-5 rounded-xl bg-card p-6 shadow-card">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-11 w-48 rounded-full" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
