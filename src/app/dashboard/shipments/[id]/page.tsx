import { Camera, Phone, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Timeline, fromStatusHistory } from "@/components/shared/timeline";
import { ShipmentStatusPanel } from "@/components/shipments/shipment-status-panel";
import { ApiError } from "@/lib/api/errors";
import { getMyShipment } from "@/lib/data/customer";
import { formatDateTime, formatMoney, formatWeight } from "@/lib/format";
import { SERVICE_NAMES } from "@/lib/status";
import type { ShipmentDetail } from "@/types";
import { ShipmentDetailSkeleton } from "./detail-skeleton";

export const metadata: Metadata = { title: "Shipment", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-4 rounded-xl bg-card p-6 shadow-card ${className ?? ""}`}>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="font-medium sm:text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const tel = (phone: string) => (
  <a href={`tel:${phone.replace(/[\s-]/g, "")}`} className="font-id underline-offset-4 hover:underline">
    {phone}
  </a>
);

function Detail({ s }: { s: ShipmentDetail }) {
  const b = s.priceBreakdown;
  const terminal = s.status === "DELIVERED" || s.status === "RETURNED" || s.status === "CANCELLED";
  return (
    <div className="space-y-6">
      <ShipmentStatusPanel shipment={{ id: s.id, trackingId: s.trackingId, status: s.status, paymentStatus: s.paymentStatus, price: s.price }} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <Card title="Journey">
            <Timeline events={fromStatusHistory(s.statusHistory)} showUpcoming={!terminal} />
          </Card>

          {s.proofOfDeliveryUrl ? (
            <Card title="Proof of delivery">
              <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-surface">
                <Image
                  src={s.proofOfDeliveryUrl}
                  alt={`Photo taken by the courier when ${s.trackingId} was handed over`}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              {s.proofOfDeliveryUploadedAt ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Camera className="size-4" aria-hidden="true" /> Uploaded {formatDateTime(s.proofOfDeliveryUploadedAt)}
                </p>
              ) : null}
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
                      <Phone className="size-3.5" aria-hidden="true" /> {tel(s.courier.phone)}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {s.pickupRequest ? (
            <Card title="Pickup">
              <Rows
                rows={[
                  ["Window", `${formatDateTime(s.pickupRequest.scheduledAt)} to ${formatDateTime(s.pickupRequest.scheduledUntil)}`],
                  ["Address", s.pickupRequest.pickupAddress],
                  ["Contact", <span key="c">{s.pickupRequest.contactName}, {tel(s.pickupRequest.contactPhone)}</span>],
                  ...(s.pickupRequest.notes ? [["Notes", s.pickupRequest.notes] as [string, ReactNode]] : []),
                ]}
              />
            </Card>
          ) : null}

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
                ["Sender", <span key="s">{s.senderName}, {tel(s.senderPhone)}</span>],
                ["Pickup", `${s.pickupAddress} (${s.originZone.name})`],
                ["Receiver", <span key="r">{s.receiverName}, {tel(s.receiverPhone)}</span>],
                ...(s.receiverEmail ? [["Receiver email", s.receiverEmail] as [string, ReactNode]] : []),
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
                  ...(s.cancelledAt ? [["Cancelled", formatDateTime(s.cancelledAt)] as [string, ReactNode]] : []),
                  ...(s.cancelReason ? [["Reason", s.cancelReason] as [string, ReactNode]] : []),
                  ...(s.failureReason ? [[`Failed attempts (${s.failedAttempts})`, s.failureReason] as [string, ReactNode]] : []),
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
