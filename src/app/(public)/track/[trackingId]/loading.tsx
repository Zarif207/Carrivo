import { Container } from "@/components/public/section";
import { TrackingResultSkeleton } from "./tracking-skeleton";

export default function TrackingLoading() {
  return (
    <section className="pt-10 pb-20 sm:pt-14">
      <Container className="space-y-10">
        <div className="h-5" />
        <TrackingResultSkeleton />
      </Container>
    </section>
  );
}
