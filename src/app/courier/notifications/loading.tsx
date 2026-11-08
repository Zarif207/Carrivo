import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-11 w-44 rounded-full" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
