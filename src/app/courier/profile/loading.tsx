import { ProfileSkeleton } from "@/components/profile/profile-sections";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourierProfileLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />
      <ProfileSkeleton panels={4} />
    </div>
  );
}
