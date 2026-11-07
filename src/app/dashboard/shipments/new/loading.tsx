import { WizardSkeleton } from "@/components/shipments/wizard/new-shipment-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewShipmentLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="mx-auto max-w-4xl">
        <WizardSkeleton />
      </div>
    </div>
  );
}
