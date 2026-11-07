import { PackageX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function ShipmentNotFound() {
  return (
    <EmptyState
      icon={PackageX}
      title="We can't find that shipment"
      description="It may have been removed, or it belongs to another account."
      action={
        <Button asChild>
          <Link href="/dashboard/shipments">See your shipments</Link>
        </Button>
      }
    />
  );
}
