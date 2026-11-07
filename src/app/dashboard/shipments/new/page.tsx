import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { NewShipmentWizard, WizardSkeleton } from "@/components/shipments/wizard/new-shipment-wizard";
import { ApiError } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPublicHubs, getPublicZones } from "@/lib/data/public";

export const metadata: Metadata = { title: "New shipment", robots: { index: false } };

/** Zones and hubs (cached public reads) plus the sender's profile for defaults. Request-time: under Suspense. */
async function Wizard() {
  let data;
  try {
    const [zones, hubs, current] = await Promise.all([getPublicZones(), getPublicHubs(), getCurrentUser()]);
    data = { zones, hubs, user: current?.user };
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="The booking form" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  if (data.zones.length === 0) {
    return <LoadError what="Delivery zones" message="No delivery zones are open yet, so shipments can't be booked." />;
  }
  const user = data.user;
  return (
    <NewShipmentWizard
      zones={data.zones}
      hubs={data.hubs}
      senderDefaults={user ? { senderName: user.name, senderPhone: user.phone ?? "", pickupAddress: user.address ?? "" } : {}}
    />
  );
}

export default function NewShipmentPage() {
  return (
    <>
      <PageHeader
        title="Book a shipment"
        description="Three short steps. You'll see the price before you book, and pay afterwards."
        back={{ href: "/dashboard/shipments", label: "All shipments" }}
      />
      <div className="mx-auto max-w-4xl">
        <Suspense fallback={<WizardSkeleton />}>
          <Wizard />
        </Suspense>
      </div>
    </>
  );
}
