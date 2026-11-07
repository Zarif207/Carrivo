import { PackageX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminShipmentNotFound() {
  return (
    <EmptyState
      icon={PackageX}
      title="We can't find that shipment"
      description="The id is wrong, or the shipment was deleted."
      action={
        <Button asChild>
          <Link href="/admin/shipments">All shipments</Link>
        </Button>
      }
    />
  );
}
