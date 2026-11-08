import { ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ProofUploader } from "@/components/courier/proof-uploader";
import { TaskStatusPanel } from "@/components/courier/task-status-panel";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline, fromStatusHistory } from "@/components/shared/timeline";
import { DetailCard, DetailRows, PhoneLink, type DetailRow } from "@/components/shipments/detail-parts";
import { ShipmentDetailSkeleton } from "@/components/shipments/detail-skeleton";
import { ApiError } from "@/lib/api/errors";
import { PROOF_STATUSES } from "@/lib/courier/actions";
import { getMyTask } from "@/lib/data/courier";
import { formatDateTime, formatMoney, formatWeight } from "@/lib/format";
import { UUID } from "@/lib/ids";
import { SERVICE_NAMES } from "@/lib/status";
import { TERMINAL_STATUSES, type ShipmentDetail, type ShipmentStatus } from "@/types";

export const metadata: Metadata = { title: "Task", robots: { index: false } };

/** Couriers earn 20 % of the shipment price on delivery (contract §2). */
const EARNING_SHARE = 0.2;

function MapsLink({ address }: { address: string }) {
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded text-sm font-semibold text-brand-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <MapPin className="size-3.5" aria-hidden="true" /> Open in Maps <ExternalLink className="size-3" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function Task({ s }: { s: ShipmentDetail }) {
  const terminal = (TERMINAL_STATUSES as readonly ShipmentStatus[]).includes(s.status);
  const canUpload = PROOF_STATUSES.includes(s.status);
  const pickup = s.pickupRequest;
  const pickupAddress = pickup?.pickupAddress ?? s.pickupAddress;

  return (
    <div className="space-y-6">
      <TaskStatusPanel
        task={{ id: s.id, trackingId: s.trackingId, status: s.status, failedAttempts: s.failedAttempts, paymentStatus: s.paymentStatus, hasProof: Boolean(s.proofOfDeliveryUrl) }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DetailCard title="Pick up from" action={<MapsLink address={pickupAddress} />}>
            <DetailRows
              rows={[
                ["Sender", s.senderName],
                ["Phone", <PhoneLink key="p" phone={s.senderPhone} />],
                ["Address", pickupAddress],
                ["Area", `${s.originZone.name}, drop at ${s.originHub.name}`],
                ...(pickup
                  ? ([
                      ["Window", `${formatDateTime(pickup.scheduledAt)} to ${formatDateTime(pickup.scheduledUntil)}`],
                      ...(pickup.contactName !== s.senderName || pickup.contactPhone !== s.senderPhone
                        ? [["On-site contact", <span key="c">{pickup.contactName}, <PhoneLink phone={pickup.contactPhone} /></span>] as DetailRow]
                        : []),
                      ...(pickup.notes ? [["Pickup notes", pickup.notes] as DetailRow] : []),
                    ] as DetailRow[])
                  : []),
              ]}
            />
          </DetailCard>

          <DetailCard title="Deliver to" action={<MapsLink address={s.deliveryAddress} />}>
            <DetailRows
              rows={[
                ["Receiver", s.receiverName],
                ["Phone", <PhoneLink key="p" phone={s.receiverPhone} className="text-lg font-semibold" />],
                ["Address", s.deliveryAddress],
                ["Area", `${s.destinationZone.name}, from ${s.destinationHub.name}`],
                ...(s.estimatedDeliveryAt ? [["Expected by", formatDateTime(s.estimatedDeliveryAt)] as DetailRow] : []),
              ]}
            />
          </DetailCard>

          {canUpload || s.proofOfDeliveryUrl ? (
            <DetailCard title="Proof of delivery">
              <ProofUploader
                shipmentId={s.id}
                trackingId={s.trackingId}
                canUpload={canUpload}
                existing={s.proofOfDeliveryUrl ? { url: s.proofOfDeliveryUrl, uploadedAt: s.proofOfDeliveryUploadedAt } : null}
              />
            </DetailCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <DetailCard title="Parcel">
            <DetailRows
              rows={[
                ["Service", SERVICE_NAMES[s.serviceType]],
                ["Weight", formatWeight(s.weightLb)],
                ["Fragile", s.isFragile ? <strong key="f" className="text-danger">Yes, handle with care</strong> : "No"],
                ["Contents", s.description ?? "Not described"],
                ...(s.declaredValue ? [["Declared value", formatMoney(s.declaredValue)] as DetailRow] : []),
              ]}
            />
          </DetailCard>

          <DetailCard title="Payment">
            <DetailRows
              rows={[
                ["Customer payment", <StatusBadge key="p" kind="shipment-payment" status={s.paymentStatus} size="sm" />],
                ["Shipment price", formatMoney(s.price)],
                [s.status === "DELIVERED" ? "You earned" : "You earn on delivery", <span key="e" className="font-bold tabular">{formatMoney(Number(s.price) * EARNING_SHARE)}</span>],
              ]}
            />
            {s.paymentStatus === "PAID" ? <p className="text-xs text-muted-foreground">Prepaid by card. Don&apos;t collect cash from the receiver.</p> : null}
          </DetailCard>

          {s.failureReason ? (
            <DetailCard title="Delivery attempts">
              <DetailRows
                rows={[
                  ["Failed attempts", String(s.failedAttempts)],
                  ["Last reason", s.failureReason],
                ]}
              />
            </DetailCard>
          ) : null}

          <DetailCard title="Journey">
            <Timeline events={fromStatusHistory(s.statusHistory)} showUpcoming={!terminal} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

async function TaskContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  let task: ShipmentDetail;
  try {
    task = await getMyTask(id);
  } catch (error) {
    unstable_rethrow(error);
    // Another courier's shipment answers 404 too: same page, nothing leaked.
    if (ApiError.isApiError(error) && (error.isNotFound || error.status === 400 || error.isForbidden)) notFound();
    return <LoadError what="This task" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <PageHeader
        title={<span className="font-id text-[0.85em] tracking-tight">{task.trackingId}</span>}
        description={`${task.originZone.name} to ${task.destinationZone.name}, ${SERVICE_NAMES[task.serviceType].toLowerCase()} service`}
        back={{ href: "/courier", label: "Active tasks" }}
      />
      <Task s={task} />
    </>
  );
}

export default function CourierTaskPage({ params }: PageProps<"/courier/tasks/[id]">) {
  return (
    <Suspense fallback={<ShipmentDetailSkeleton />}>
      <TaskContent params={params} />
    </Suspense>
  );
}
