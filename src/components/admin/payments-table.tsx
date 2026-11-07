"use client";

// Client: table interactions (URL sort, row links) over rows rendered by the server.
import { Receipt, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type { AdminPayment } from "@/types";
import { RefundButton } from "./refund-button";

const href = (row: AdminPayment) => `/admin/shipments/${row.shipment.id}`;

function Review({ row }: { row: AdminPayment }) {
  if (!row.admin.requiresReview) return null;
  return (
    <span className="flex items-start gap-1 text-xs font-medium text-tone-amber-fg" title={row.admin.reviewReason ?? undefined}>
      <ShieldAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" /> <span className="line-clamp-2">Review: {row.admin.reviewReason ?? "flagged"}</span>
    </span>
  );
}

function when(row: AdminPayment): string {
  if (row.refundedAt) return `Refunded ${formatDateTime(row.refundedAt)}`;
  if (row.paidAt) return `Paid ${formatDateTime(row.paidAt)}`;
  return `Started ${formatDateTime(row.createdAt)}`;
}

const columns: DataTableColumn<AdminPayment>[] = [
  {
    id: "shipment",
    header: "Shipment",
    cell: (row) => (
      <Link href={href(row)} className="rounded font-id font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {row.shipment.trackingId}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: (row) => (
      <div className="max-w-48 min-w-0">
        <p className="truncate font-medium">{row.admin.customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.admin.customer.email}</p>
      </div>
    ),
  },
  { id: "amount", header: "Amount", sortKey: "amount", align: "right", cell: (row) => <span className="font-semibold tabular">{formatMoney(row.paidAmount ?? row.amount)}</span> },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (row) => (
      <div className="space-y-1">
        <StatusBadge kind="payment" status={row.status} size="sm" />
        <Review row={row} />
      </div>
    ),
  },
  { id: "when", header: "Latest", sortKey: "paidAt", className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell", cell: (row) => <span className="text-sm whitespace-nowrap text-muted-foreground">{when(row)}</span> },
  { id: "created", header: "Started", sortKey: "createdAt", className: "hidden 2xl:table-cell", headerClassName: "hidden 2xl:table-cell", cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span> },
  {
    id: "actions",
    header: <span className="sr-only">Actions</span>,
    align: "right",
    cell: (row) => (row.status === "REFUND_PENDING" ? <RefundButton paymentId={row.id} amount={row.paidAmount ?? row.amount} trackingId={row.shipment.trackingId} /> : null),
  },
];

function MobileCard(row: AdminPayment) {
  return (
    <div>
      <Link href={href(row)} className="block space-y-1.5 p-4 outline-none focus-visible:bg-accent">
        <div className="flex items-start justify-between gap-3">
          <p className="font-id text-sm font-semibold">{row.shipment.trackingId}</p>
          <p className="font-semibold tabular">{formatMoney(row.paidAmount ?? row.amount)}</p>
        </div>
        <p className="truncate text-sm text-muted-foreground">{row.admin.customer.name}</p>
        <StatusBadge kind="payment" status={row.status} size="sm" />
        <Review row={row} />
        <p className="text-xs text-muted-foreground">{when(row)}</p>
      </Link>
      {row.status === "REFUND_PENDING" ? (
        <div className="px-4 pb-4">
          <RefundButton paymentId={row.id} amount={row.paidAmount ?? row.amount} trackingId={row.shipment.trackingId} />
        </div>
      ) : null}
    </div>
  );
}

export function AdminPaymentsTable({ rows, filtered }: { rows: AdminPayment[]; filtered: boolean }) {
  return (
    <DataTable
      caption="Payments"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={href}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={MobileCard}
      emptyState={
        <EmptyState
          variant="plain"
          icon={Receipt}
          title={filtered ? "No payments match" : "No payments yet"}
          description={filtered ? "Try another status or dates, or clear the filters." : "Card payments appear here when customers check out."}
          action={
            filtered ? (
              <Button asChild variant="outline">
                <Link href="/admin/payments">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      }
    />
  );
}
