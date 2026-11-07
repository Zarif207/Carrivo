import { LogoMark } from "@/components/shared/logo";
import { Skeleton } from "@/components/ui/skeleton";

/** Static stand-in for the dashboard frame while the session is verified (same geometry: no shift). */
export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-dvh w-full lg:h-dvh lg:overflow-hidden lg:bg-sidebar" aria-busy="true" aria-label="Loading your dashboard">
      <div className="hidden w-64 shrink-0 flex-col gap-2 bg-sidebar px-3 lg:flex">
        <div className="flex h-20 items-center px-2">
          <LogoMark className="size-8" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-full bg-white/8" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-background lg:my-3 lg:mr-3 lg:rounded-panel lg:shadow-overlay">
        <div className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6 lg:h-[4.5rem] lg:border-transparent lg:px-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="size-10 rounded-full" />
        </div>
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8 lg:pt-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
