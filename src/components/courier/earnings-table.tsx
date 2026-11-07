"use client";

// Client: table interactions (URL sort, row links) over rows rendered by the server.
import { SearchX, Wallet } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { SERVICE_NAMES } from "@/lib/status";
import type { Earning } from "@/types";

const taskHref = (row: Earning) => `/courier/tasks/${row.shipment.id}`;

const columns: DataTableColumn<Earning>[] = [
  {
    id: "shipment",
    header: "Shipment",
    cell: (row) => (
      <Link href={taskHref(row)} className="rounded font-id font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {row.shipment.trackingId}
      </Link>
    ),
  },
  { id: "service", header: "Service", cell: (row) => SERVICE_NAMES[row.shipment.serviceType] },
  {
    id: "price",
    header: "Shipment price",
    align: "right",
    className: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
    cell: (row) => <span className="tabular">{formatMoney(row.shipment.price)}</span>,
  },
  { id: "amount", header: "You earned", sortKey: "amount", align: "right", cell: (row) => <span className="font-semibold tabular">{formatMoney(row.amount)}</span> },
  { id: "status", header: "Payout", cell: (row) => <StatusBadge kind="earning" status={row.status} size="sm" /> },
  { id: "created", header: "Earned", sortKey: "createdAt", cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span> },
  {
    id: "paid",
    header: "Paid out",
    className: "hidden xl:table-cell",
    headerClassName: "hidden xl:table-cell",
    cell: (row) => <span className="whitespace-nowrap text-muted-foreground">{row.paidOutAt ? formatDate(row.paidOutAt) : "Not yet"}</span>,
  },
];

function MobileCard(row: Earning) {
  return (
    <Link href={taskHref(row)} className="flex items-start justify-between gap-3 p-4 outline-none focus-visible:bg-accent">
      <div className="min-w-0 space-y-1.5">
        <p className="font-id text-sm font-semibold">{row.shipment.trackingId}</p>
        <StatusBadge kind="earning" status={row.status} size="sm" />
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold tabular">{formatMoney(row.amount)}</p>
        <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
      </div>
    </Link>
  );
}

export function EarningsTable({ rows, filtered, rangeLabel }: { rows: Earning[]; filtered: boolean; rangeLabel: string }) {
  return (
    <DataTable
      caption={`Earnings ${rangeLabel}`}
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={taskHref}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={MobileCard}
      emptyState={
        filtered ? (
          <EmptyState
            variant="plain"
            icon={SearchX}
            title="No earnings with this payout status"
            description="Pick another status, or clear the filter."
            action={
              <Button asChild variant="outline">
                <Link href="/courier/earnings">Clear filter</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState variant="plain" icon={Wallet} title={`No earnings ${rangeLabel}`} description="You earn 20% of each shipment's price when you mark it delivered." />
        )
      }
    />
  );
}
