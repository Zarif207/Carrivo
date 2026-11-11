import { ApplicationSkeleton } from "@/components/courier-application/application-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourierApplicationLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <ApplicationSkeleton />
    </div>
  );
}
