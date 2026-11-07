import { Container } from "@/components/public/section";
import { Skeleton } from "@/components/ui/skeleton";
import { CalculatorSkeleton } from "./calculator-skeleton";

export default function PricingLoading() {
  return (
    <Container className="space-y-10 py-16">
      <Skeleton className="h-28 w-full max-w-3xl" />
      <CalculatorSkeleton />
    </Container>
  );
}
