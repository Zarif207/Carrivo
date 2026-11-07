import { CoverageSkeleton } from "@/components/public/live-data";
import { Container } from "@/components/public/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <Container className="space-y-10 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-20 w-64" />
          <Skeleton className="h-[30rem] rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
      <CoverageSkeleton />
    </Container>
  );
}
