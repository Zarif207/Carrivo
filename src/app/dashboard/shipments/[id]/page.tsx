import { Phone, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Timeline, fromStatusHistory } from "@/components/shared/timeline";
import { DetailCard as Card, DetailRows as Rows, PhoneLink, ProofImage, type DetailRow } from "@/components/shipments/detail-parts";
import { ShipmentDetailSkeleton } from "@/components/shipments/detail-skeleton";
import { PickupCard } from "@/components/shipments/pickup-card";
import { ShipmentStatusPanel } from "@/components/shipments/shipment-status-panel";
import { ApiError } from "@/lib/api/errors";
import { getMyShipment } from "@/lib/data/customer";
import { formatDateTime, formatMoney, formatWeight } from "@/lib/format";
import { UUID } from "@/lib/ids";
import { SERVICE_NAMES } from "@/lib/status";
import type { ShipmentDetail } from "@/types";

export const metadata: Metadata = { title: "Shipment", robots: { index: false } };

function Detail({ s }: { s: ShipmentDetail }) {
  const b = s.priceBreakdown;
  const terminal = s.status === "DELIVERED" || s.status === "RETURNED" || s.status === "CANCELLED";
  return (
    <div className="space-y-6">
      <ShipmentStatusPanel shipment={{ id: s.id, trackingId: s.trackingId, status: s.status, paymentStatus: s.paymentStatus, price: s.price }} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <Card title="Journey">
            <Timeline events={fromStatusHistory(s.statusHistory)} showUpcoming={!terminal} />
          </Card>

          {s.proofOfDeliveryUrl ? (
            <Card title="Proof of delivery">
              <ProofImage url={s.proofOfDeliveryUrl} uploadedAt={s.proofOfDeliveryUploadedAt} trackingId={s.trackingId} />
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {s.courier ? (
            <Card title="Your courier">
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary">
                  <UserRound className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold">{s.courier.name}</p>
                  {s.courier.phone ? (
                    <p className="flex items-center gap-1.5 text-sm">
                      <Phone className="size-3.5" aria-hidden="true" /> <PhoneLink phone={s.courier.phone} />
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          <PickupCard s={s} />

          <Card title="Parcel">
            <Rows
              rows={[
                ["Service", SERVICE_NAMES[s.serviceType]],
                ["Weight", formatWeight(s.weightKg)],
                ["Contents", s.description ?? "Not described"],
                ["Fragile", s.isFragile ? "Yes, handle with care" : "No"],
                ["Declared value", s.declaredValue ? formatMoney(s.declaredValue) : "Not declared"],
              ]}
            />
          </Card>

          <Card title="From and to">
            <Rows
              rows={[
                ["Sender", <span key="s">{s.senderName}, <PhoneLink phone={s.senderPhone} /></span>],
                ["Pickup", `${s.pickupAddress} (${s.originZone.name})`],
                ["Receiver", <span key="r">{s.receiverName}, <PhoneLink phone={s.receiverPhone} /></span>],
                ...(s.receiverEmail ? [["Receiver email", s.receiverEmail] as DetailRow] : []),
                ["Delivery", `${s.deliveryAddress} (${s.destinationZone.name})`],
              ]}
            />
          </Card>

          <Card title="Price">
            <Rows
              rows={[
                [`Base fee (first ${formatWeight(b.baseWeightKg)})`, formatMoney(b.baseFee)],
                [`Extra weight (${Number(b.chargeableExtraKg)} kg × ${formatMoney(b.perKgFee)})`, formatMoney(b.weightCharge)],
                ["Total", <span key="t" className="text-lg font-extrabold tabular">{formatMoney(s.price)}</span>],
              ]}
            />
            <p className="text-xs text-muted-foreground">Rule: {b.ruleName}. Calculated {formatDateTime(b.calculatedAt)}.</p>
          </Card>

          {s.cancelledAt || s.failureReason ? (
            <Card title="Notes">
              <Rows
                rows={[
                  ...(s.cancelledAt ? [["Cancelled", formatDateTime(s.cancelledAt)] as DetailRow] : []),
                  ...(s.cancelReason ? [["Reason", s.cancelReason] as DetailRow] : []),
                  ...(s.failureReason ? [[`Failed attempts (${s.failedAttempts})`, s.failureReason] as DetailRow] : []),
                ]}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

async function ShipmentContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  let shipment: ShipmentDetail;
  try {
    shipment = await getMyShipment(id);
  } catch (error) {
    unstable_rethrow(error);
    if (ApiError.isApiError(error) && (error.isNotFound || error.status === 400)) notFound();
    return <LoadError what="This shipment" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <PageHeader
        title={<span className="font-id text-[0.85em] tracking-tight">{shipment.trackingId}</span>}
        description={`Booked ${formatDateTime(shipment.createdAt)}, ${shipment.originZone.name} to ${shipment.destinationZone.name}`}
        back={{ href: "/dashboard/shipments", label: "All shipments" }}
      />
      <Detail s={shipment} />
    </>
  );
}

export default function ShipmentPage({ params }: PageProps<"/dashboard/shipments/[id]">) {
  return (
    <Suspense fallback={<ShipmentDetailSkeleton />}>
      <ShipmentContent params={params} />
    </Suspense>
  );
}
