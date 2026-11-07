import { CalendarClock, CircleCheck, CreditCard } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { ShipmentDetail } from "@/types";
import { DetailCard, DetailRows, PhoneLink, type DetailRow } from "./detail-parts";
import { SchedulePickupDialog } from "./schedule-pickup-dialog";

/*
 * The customer's pickup, per the contract: a window can be booked once the shipment is PAID and still
 * PENDING; there is no reschedule (the API only accepts it from PENDING) and no separate pickup cancel,
 * so after booking the way out is cancelling the shipment before it's picked up.
 */
export function PickupCard({ s }: { s: ShipmentDetail }) {
  const p = s.pickupRequest;

  if (!p) {
    if (s.status !== "PENDING") return null; // cancelled before a window was booked
    const paid = s.paymentStatus === "PAID";
    return (
      <DetailCard title="Pickup">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary">
            {paid ? <CalendarClock className="size-5" aria-hidden="true" /> : <CreditCard className="size-5" aria-hidden="true" />}
          </span>
          <p className="text-muted-foreground">
            {paid ? "Choose when a courier can collect the parcel. We assign one for your window." : "Pay for the shipment first, then choose a pickup window."}
          </p>
        </div>
        {paid ? <SchedulePickupDialog shipment={{ id: s.id, trackingId: s.trackingId, pickupAddress: s.pickupAddress, senderName: s.senderName, senderPhone: s.senderPhone }} /> : null}
      </DetailCard>
    );
  }

  const collected = p.status === "COMPLETED" || Boolean(s.pickedUpAt);
  const state =
    p.status === "CANCELLED" ? "Cancelled" : collected ? `Collected ${formatDateTime(p.completedAt ?? s.pickedUpAt)}` : s.courier ? `Booked, ${s.courier.name} is coming` : "Booked, assigning a courier";

  return (
    <DetailCard title="Pickup">
      <DetailRows
        rows={[
          [
            "Status",
            <span key="s" className="inline-flex items-center gap-1.5">
              {collected ? <CircleCheck className="size-4 text-success" aria-hidden="true" /> : null}
              {state}
            </span>,
          ],
          ["Window", `${formatDateTime(p.scheduledAt)} to ${formatDateTime(p.scheduledUntil)}`],
          ["Address", p.pickupAddress],
          ["Contact", <span key="c">{p.contactName}, <PhoneLink phone={p.contactPhone} /></span>],
          ...(p.notes ? [["Notes", p.notes] as DetailRow] : []),
        ]}
      />
      {!collected && p.status === "SCHEDULED" ? (
        <p className="text-xs text-muted-foreground">The window can&apos;t be changed once booked. If plans change, cancel the shipment before it&apos;s picked up.</p>
      ) : null}
    </DetailCard>
  );
}
