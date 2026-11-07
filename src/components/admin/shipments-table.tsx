"use client";

// Client: table interactions (URL sort, row links) over rows rendered by the server.
import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import type { ShipmentListItem } from "@/types";

const href = (row: ShipmentListItem) => `/admin/shipments/${row.id}`;

const columns: DataTableColumn<ShipmentListItem>[] = [
  {
    id: "tracking",
    header: "Tracking ID",
    sortKey: "trackingId",
    cell: (row) => (
      <Link href={href(row)} className="rounded font-id font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {row.trackingId}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: (row) => (
      <div className="max-w-44 min-w-0">
        <p className="truncate font-medium">{row.customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.originZone.name} to {row.destinationZone.name}
        </p>
      </div>
    ),
  },
  {
    id: "courier",
    header: "Courier",
    className: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
    cell: (row) => (row.courier ? <span className="whitespace-nowrap">{row.courier.name}</span> : <span className="text-muted-foreground">Unassigned</span>),
  },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="shipment" status={row.status} size="sm" /> },
  {
    id: "payment",
    header: "Payment",
    className: "hidden xl:table-cell",
    headerClassName: "hidden xl:table-cell",
    cell: (row) => <StatusBadge kind="shipment-payment" status={row.paymentStatus} size="sm" />,
  },
  { id: "price", header: "Price", sortKey: "price", align: "right", cell: (row) => <span className="font-semibold tabular">{formatMoney(row.price)}</span> },
  {
    id: "created",
    header: "Booked",
    sortKey: "createdAt",
    className: "hidden 2xl:table-cell",
    headerClassName: "hidden 2xl:table-cell",
    cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span>,
  },
];

function MobileCard(row: ShipmentListItem) {
  return (
    <Link href={href(row)} className="block space-y-2 p-4 outline-none focus-visible:bg-accent">
      <div className="flex items-start justify-between gap-3">
        <p className="font-id text-sm font-semibold">{row.trackingId}</p>
        <p className="font-semibold tabular">{formatMoney(row.price)}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {row.customer.name}, {row.originZone.name} to {row.destinationZone.name}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge kind="shipment" status={row.status} size="sm" />
        <StatusBadge kind="shipment-payment" status={row.paymentStatus} size="sm" />
        <span className="text-xs text-muted-foreground">{row.courier ? row.courier.name : "Unassigned"}</span>
      </div>
    </Link>
  );
}

export function AdminShipmentsTable({ rows, filtered }: { rows: ShipmentListItem[]; filtered: boolean }) {
  return (
    <DataTable
      caption="All shipments"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={href}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={MobileCard}
      emptyState={
        <EmptyState
          variant="plain"
          icon={PackageSearch}
          title={filtered ? "No shipments match" : "No shipments yet"}
          description={filtered ? "Try another search, or clear the filters." : "Shipments appear here as soon as customers book them."}
          action={
            filtered ? (
              <Button asChild variant="outline">
                <Link href="/admin/shipments">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      }
    />
  );
}
