import { Container } from "@/components/public/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <Container className="grid gap-12 py-16 lg:grid-cols-2">
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-12 w-60 rounded-full" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
      <Skeleton className="h-[28rem] w-full rounded-[2rem]" />
    </Container>
  );
}
