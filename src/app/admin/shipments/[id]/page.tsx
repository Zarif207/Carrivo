import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { RefundButton } from "@/components/admin/refund-button";
import { AdminShipmentActions } from "@/components/admin/shipment-actions";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline, fromStatusHistory } from "@/components/shared/timeline";
import { DetailCard, DetailRows, PhoneLink, ProofImage, type DetailRow } from "@/components/shipments/detail-parts";
import { ShipmentDetailSkeleton } from "@/components/shipments/detail-skeleton";
import { ApiError } from "@/lib/api/errors";
import { getAdminShipment, listAdminPayments } from "@/lib/data/admin";
import { getPublicHubs } from "@/lib/data/public";
import { formatDateTime, formatMoney, formatWeight } from "@/lib/format";
import { UUID } from "@/lib/ids";
import { SERVICE_NAMES } from "@/lib/status";
import { TERMINAL_STATUSES, type AdminPayment, type Hub, type ShipmentDetail, type ShipmentStatus } from "@/types";

export const metadata: Metadata = { title: "Shipment", robots: { index: false } };

const linkClass = "rounded font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

function PaymentRows({ payments }: { payments: AdminPayment[] }) {
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">No checkout started yet.</p>;
  return (
    <ul className="divide-y divide-border">
      {payments.map((p) => (
        <li key={p.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge kind="payment" status={p.status} size="sm" />
            <span className="font-semibold tabular">{formatMoney(p.paidAmount ?? p.amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Started {formatDateTime(p.createdAt)}
            {p.paidAt ? `, paid ${formatDateTime(p.paidAt)}` : ""}
            {p.refundedAt ? `, refunded ${formatDateTime(p.refundedAt)}` : ""}
          </p>
          {p.failureReason ? <p className="text-sm">Last error: {p.failureReason}</p> : null}
          {p.admin?.requiresReview ? (
            <p className="flex items-start gap-1.5 rounded-lg bg-tone-amber-bg px-3 py-2 text-sm text-tone-amber-fg">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Needs review: {p.admin.reviewReason ?? "flagged by the payment checks"}
            </p>
          ) : null}
          {p.status === "REFUND_PENDING" ? <RefundButton paymentId={p.id} amount={p.paidAmount ?? p.amount} trackingId={p.shipment.trackingId} /> : null}
        </li>
      ))}
    </ul>
  );
}

function Detail({ s, payments, hubs }: { s: ShipmentDetail; payments: AdminPayment[]; hubs: Hub[] }) {
  const terminal = (TERMINAL_STATUSES as readonly ShipmentStatus[]).includes(s.status);
  const b = s.priceBreakdown;
  return (
    <div className="space-y-6">
      <AdminShipmentActions
        shipment={{
          id: s.id,
          trackingId: s.trackingId,
          status: s.status,
          paymentStatus: s.paymentStatus,
          failedAttempts: s.failedAttempts,
          courier: s.courier ? { id: s.courier.id, name: s.courier.name } : null,
          originZone: { id: s.originZone.id, name: s.originZone.name },
          originHubId: s.originHub.id,
          destinationHubId: s.destinationHub.id,
        }}
        originHubs={hubs.filter((h) => h.zone.id === s.originZone.id).map((h) => ({ id: h.id, name: h.name }))}
        destinationHubs={hubs.filter((h) => h.zone.id === s.destinationZone.id).map((h) => ({ id: h.id, name: h.name }))}
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <DetailCard title="Journey">
            <Timeline events={fromStatusHistory(s.statusHistory)} showUpcoming={!terminal} />
          </DetailCard>
          {s.proofOfDeliveryUrl ? (
            <DetailCard title="Proof of delivery">
              <ProofImage url={s.proofOfDeliveryUrl} uploadedAt={s.proofOfDeliveryUploadedAt} trackingId={s.trackingId} />
            </DetailCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <DetailCard title="People">
            <DetailRows
              rows={[
                [
                  "Customer",
                  <Link key="c" href={`/admin/users?view=${s.customer.id}`} className={linkClass}>
                    {s.customer.name}
                  </Link>,
                ],
                [
                  "Courier",
                  s.courier ? (
                    <span key="k">
                      <Link href={`/admin/users?view=${s.courier.id}`} className={linkClass}>
                        {s.courier.name}
                      </Link>
                      {s.courier.phone ? (
                        <>
                          , <PhoneLink phone={s.courier.phone} />
                        </>
                      ) : null}
                    </span>
                  ) : (
                    "Not assigned"
                  ),
                ],
                ["Sender", <span key="s">{s.senderName}, <PhoneLink phone={s.senderPhone} /></span>],
                ["Receiver", <span key="r">{s.receiverName}, <PhoneLink phone={s.receiverPhone} /></span>],
                ...(s.receiverEmail ? [["Receiver email", s.receiverEmail] as DetailRow] : []),
              ]}
            />
          </DetailCard>

          <DetailCard title="Payment">
            <PaymentRows payments={payments} />
          </DetailCard>

          <DetailCard title="Route">
            <DetailRows
              rows={[
                ["Pickup", `${s.pickupAddress} (${s.originZone.name})`],
                ["Origin hub", s.originHub.name],
                ["Destination hub", s.destinationHub.name],
                ["Delivery", `${s.deliveryAddress} (${s.destinationZone.name})`],
                ...(s.currentHub ? [["Now at", s.currentHub.name] as DetailRow] : []),
                ...(s.pickupRequest ? [["Pickup window", `${formatDateTime(s.pickupRequest.scheduledAt)} to ${formatDateTime(s.pickupRequest.scheduledUntil)}`] as DetailRow] : []),
                ...(s.estimatedDeliveryAt ? [["Expected by", formatDateTime(s.estimatedDeliveryAt)] as DetailRow] : []),
              ]}
            />
          </DetailCard>

          <DetailCard title="Parcel and price">
            <DetailRows
              rows={[
                ["Service", SERVICE_NAMES[s.serviceType]],
                ["Weight", formatWeight(s.weightKg)],
                ["Contents", s.description ?? "Not described"],
                ["Fragile", s.isFragile ? "Yes" : "No"],
                ["Declared value", s.declaredValue ? formatMoney(s.declaredValue) : "Not declared"],
                ["Price", <span key="p" className="font-extrabold tabular">{formatMoney(s.price)}</span>],
              ]}
            />
            <p className="text-xs text-muted-foreground">
              {b.ruleName}: {formatMoney(b.baseFee)} for the first {formatWeight(b.baseWeightKg)}, then {formatMoney(b.perKgFee)} per kg.
            </p>
          </DetailCard>

          {s.failureReason || s.cancelReason ? (
            <DetailCard title="Notes">
              <DetailRows
                rows={[
                  ...(s.failureReason ? [[`Failed attempts (${s.failedAttempts})`, s.failureReason] as DetailRow] : []),
                  ...(s.cancelReason ? [["Cancel reason", s.cancelReason] as DetailRow] : []),
                ]}
              />
            </DetailCard>
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
  let payments: AdminPayment[];
  let hubs: Hub[];
  try {
    [shipment, payments, hubs] = await Promise.all([
      getAdminShipment(id),
      listAdminPayments({ shipmentId: id, limit: 10, sortBy: "createdAt", sortOrder: "desc" }).then((r) => r.data),
      getPublicHubs(),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    if (ApiError.isApiError(error) && (error.isNotFound || error.status === 400)) notFound();
    return <LoadError what="This shipment" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <PageHeader
        title={<span className="font-id text-[0.85em] tracking-tight">{shipment.trackingId}</span>}
        description={`Booked ${formatDateTime(shipment.createdAt)} by ${shipment.customer.name}, ${shipment.originZone.name} to ${shipment.destinationZone.name}`}
        back={{ href: "/admin/shipments", label: "All shipments" }}
      />
      <Detail s={shipment} payments={payments} hubs={hubs} />
    </>
  );
}

export default function AdminShipmentPage({ params }: PageProps<"/admin/shipments/[id]">) {
  return (
    <Suspense fallback={<ShipmentDetailSkeleton />}>
      <ShipmentContent params={params} />
    </Suspense>
  );
}
