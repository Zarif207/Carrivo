import { CoverageSkeleton } from "@/components/public/live-data";
import { Container } from "@/components/public/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <Container className="space-y-10 py-16">
      <Skeleton className="h-24 w-full max-w-3xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
      <CoverageSkeleton />
    </Container>
  );
}
