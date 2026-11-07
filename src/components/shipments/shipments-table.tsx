"use client";

// Client: table interactions (URL sort, row links) over rows rendered by the server.
import { ArrowRight, PackagePlus, PackageSearch } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, formatWeight } from "@/lib/format";
import { SERVICE_NAMES } from "@/lib/status";
import type { ShipmentListItem } from "@/types";

const detailHref = (row: ShipmentListItem) => `/dashboard/shipments/${row.id}`;

const columns: DataTableColumn<ShipmentListItem>[] = [
  {
    id: "tracking",
    header: "Tracking ID",
    sortKey: "trackingId",
    cell: (row) => (
      <Link href={detailHref(row)} className="rounded font-id font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {row.trackingId}
      </Link>
    ),
  },
  {
    id: "receiver",
    header: "Receiver",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.receiverName}</p>
        <p className="truncate text-xs text-muted-foreground">{row.destinationZone.name}</p>
      </div>
    ),
  },
  { id: "service", header: "Service", cell: (row) => SERVICE_NAMES[row.serviceType] },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="shipment" status={row.status} size="sm" /> },
  { id: "payment", header: "Payment", cell: (row) => <StatusBadge kind="shipment-payment" status={row.paymentStatus} size="sm" /> },
  { id: "weight", header: "Weight", sortKey: "weightKg", align: "right", cell: (row) => <span className="tabular whitespace-nowrap">{formatWeight(row.weightKg)}</span> },
  { id: "price", header: "Price", sortKey: "price", align: "right", cell: (row) => <span className="font-semibold tabular">{formatMoney(row.price)}</span> },
  { id: "created", header: "Booked", sortKey: "createdAt", cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span> },
];

function MobileCard(row: ShipmentListItem) {
  return (
    <Link href={detailHref(row)} className="flex items-start justify-between gap-3 p-4 outline-none focus-visible:bg-accent">
      <div className="min-w-0 space-y-1.5">
        <p className="font-id text-sm font-semibold">{row.trackingId}</p>
        <p className="truncate text-sm text-muted-foreground">
          To {row.receiverName}, {row.destinationZone.name}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge kind="shipment" status={row.status} size="sm" />
          <StatusBadge kind="shipment-payment" status={row.paymentStatus} size="sm" />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold tabular">{formatMoney(row.price)}</p>
        <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
      </div>
    </Link>
  );
}

interface ShipmentsTableProps {
  rows: ShipmentListItem[];
  /** True when a search or filter is active (changes the empty state). */
  filtered: boolean;
  caption?: string;
  defaultSort?: { key: string; order: "asc" | "desc" };
  /** False where the page doesn't read ?sortBy (e.g. the dashboard's recent list). */
  sortable?: boolean;
}

const unsortable = columns.map((column) => ({ ...column, sortKey: undefined }));

export function ShipmentsTable({ rows, filtered, caption = "Your shipments", defaultSort = { key: "createdAt", order: "desc" }, sortable = true }: ShipmentsTableProps) {
  return (
    <DataTable
      caption={caption}
      columns={sortable ? columns : unsortable}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={detailHref}
      defaultSort={sortable ? defaultSort : undefined}
      renderMobileCard={MobileCard}
      emptyState={
        filtered ? (
          <EmptyState
            variant="plain"
            icon={PackageSearch}
            title="No shipments match"
            description="Try another search, or clear the filters to see every shipment."
            action={
              <Button asChild variant="outline">
                <Link href="/dashboard/shipments">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            variant="plain"
            icon={PackagePlus}
            title="No shipments yet"
            description="Book your first parcel: you'll see the price before you pay."
            action={
              <Button asChild>
                <Link href="/dashboard/shipments/new">
                  Book a shipment <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          />
        )
      }
    />
  );
}
