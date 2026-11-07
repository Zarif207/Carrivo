"use client";

// Client: table interactions (URL sort, row links) over rows rendered by the server.
import { ArrowRight, Receipt, SearchX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { isPayable } from "@/lib/payments/payable";
import type { Payment } from "@/types";
import { PayButton } from "./pay-button";

const shipmentHref = (row: Payment) => `/dashboard/shipments/${row.shipment.id}`;

/** The one line that explains a payment's state beyond its badge. */
function note(row: Payment): ReactNode {
  switch (row.status) {
    case "PAID":
      return row.paidAt ? `Paid ${formatDateTime(row.paidAt)}` : "Paid";
    case "REFUNDED":
      return row.refundedAt ? `Refunded ${formatDateTime(row.refundedAt)}` : "Refunded to your card";
    case "REFUND_PENDING":
      return "Refund requested; Stripe usually takes a few days";
    case "FAILED":
      return row.failureReason ?? "The payment didn't go through";
    case "EXPIRED":
      return "Checkout closed before payment";
    case "PENDING":
      return row.failureReason ? `Last attempt: ${row.failureReason}` : "Checkout started, not finished";
  }
}

/** A still-open checkout can be finished (initiate returns the same session). */
const resumable = (row: Payment) => row.status === "PENDING" && isPayable(row.shipment);

const columns: DataTableColumn<Payment>[] = [
  {
    id: "shipment",
    header: "Shipment",
    cell: (row) => (
      <Link href={shipmentHref(row)} className="rounded font-id font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {row.shipment.trackingId}
      </Link>
    ),
  },
  { id: "amount", header: "Amount", sortKey: "amount", align: "right", cell: (row) => <span className="font-semibold tabular">{formatMoney(row.paidAmount ?? row.amount)}</span> },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="payment" status={row.status} size="sm" /> },
  { id: "note", header: "Details", cell: (row) => <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{note(row)}</span> },
  { id: "created", header: "Started", sortKey: "createdAt", cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span> },
  {
    id: "actions",
    header: <span className="sr-only">Actions</span>,
    align: "right",
    cell: (row) =>
      resumable(row) ? <PayButton shipmentId={row.shipment.id} amount={row.amount} label="Finish paying" trackingId={row.shipment.trackingId} size="sm" variant="outline" showAmount={false} /> : null,
  },
];

function MobileCard(row: Payment) {
  return (
    <div>
      <Link href={shipmentHref(row)} className="flex items-start justify-between gap-3 p-4 outline-none focus-visible:bg-accent">
        <div className="min-w-0 space-y-1.5">
          <p className="font-id text-sm font-semibold">{row.shipment.trackingId}</p>
          <StatusBadge kind="payment" status={row.status} size="sm" />
          <p className="text-sm text-muted-foreground">{note(row)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold tabular">{formatMoney(row.paidAmount ?? row.amount)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
        </div>
      </Link>
      {resumable(row) ? (
        <div className="px-4 pb-4">
          <PayButton shipmentId={row.shipment.id} amount={row.amount} label="Finish paying" trackingId={row.shipment.trackingId} size="sm" variant="outline" showAmount={false} className="w-full" />
        </div>
      ) : null}
    </div>
  );
}

export function PaymentsTable({ rows, filtered }: { rows: Payment[]; filtered: boolean }) {
  return (
    <DataTable
      caption="Your payments"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={shipmentHref}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={MobileCard}
      emptyState={
        filtered ? (
          <EmptyState
            variant="plain"
            icon={SearchX}
            title="No payments with this status"
            description="Pick another status, or clear the filter to see every payment."
            action={
              <Button asChild variant="outline">
                <Link href="/dashboard/payments">Clear filter</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            variant="plain"
            icon={Receipt}
            title="No payments yet"
            description="When you pay for a shipment, the receipt shows up here."
            action={
              <Button asChild>
                <Link href="/dashboard/shipments?paymentStatus=UNPAID">
                  See unpaid shipments <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          />
        )
      }
    />
  );
}
