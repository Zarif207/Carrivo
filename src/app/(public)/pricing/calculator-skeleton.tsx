import { Skeleton } from "@/components/ui/skeleton";

/** Same footprint as the calculator, so nothing shifts when it streams in. */
export function CalculatorSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8" aria-hidden="true">
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-16 sm:max-w-56" />
        <Skeleton className="h-20 w-80 max-w-full" />
        <Skeleton className="h-12 w-36 rounded-full" />
      </div>
      <div className="min-h-[22rem] rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="mt-4 h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>
    </div>
  );
}
