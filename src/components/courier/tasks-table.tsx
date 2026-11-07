"use client";

// Client: table interactions (URL sort, row links) over rows rendered by the server.
import { ClipboardCheck, PackageSearch, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { CourierTask } from "@/types";

const taskHref = (row: CourierTask) => `/courier/tasks/${row.id}`;

function Fragile() {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-danger">
      <TriangleAlert className="size-3.5" aria-hidden="true" /> Fragile
    </span>
  );
}

const columns: DataTableColumn<CourierTask>[] = [
  {
    id: "tracking",
    header: "Tracking ID",
    cell: (row) => (
      <div className="space-y-0.5">
        <Link href={taskHref(row)} className="rounded font-id font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
          {row.trackingId}
        </Link>
        {row.isFragile ? <Fragile /> : null}
      </div>
    ),
  },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="shipment" status={row.status} size="sm" /> },
  {
    id: "pickup",
    header: "Pick up",
    cell: (row) => (
      <div className="max-w-56 min-w-0">
        <p className="truncate font-medium">{row.senderName}</p>
        <p className="truncate text-xs text-muted-foreground">{row.originZone.name}</p>
      </div>
    ),
  },
  {
    id: "deliver",
    header: "Deliver to",
    cell: (row) => (
      <div className="max-w-56 min-w-0">
        <p className="truncate font-medium">{row.receiverName}</p>
        <p className="truncate text-xs text-muted-foreground">{row.destinationZone.name}</p>
      </div>
    ),
  },
  {
    id: "attempts",
    header: "Attempts",
    align: "right",
    className: "hidden 2xl:table-cell",
    headerClassName: "hidden 2xl:table-cell",
    cell: (row) => <span className="tabular">{row.failedAttempts}</span>,
  },
  { id: "updated", header: "Updated", sortKey: "updatedAt", cell: (row) => <RelativeTime value={row.updatedAt} className="whitespace-nowrap" /> },
];

function MobileCard(row: CourierTask) {
  return (
    <Link href={taskHref(row)} className="block space-y-2 p-4 outline-none focus-visible:bg-accent">
      <div className="flex items-start justify-between gap-3">
        <p className="font-id text-sm font-semibold">{row.trackingId}</p>
        <StatusBadge kind="shipment" status={row.status} size="sm" />
      </div>
      <p className="text-sm">
        <span className="text-muted-foreground">From</span> {row.senderName}, {row.originZone.name}
      </p>
      <p className="text-sm">
        <span className="text-muted-foreground">To</span> {row.receiverName}, {row.destinationZone.name}
      </p>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {row.isFragile ? <Fragile /> : <span />}
        <span>
          Updated <RelativeTime value={row.updatedAt} />
        </span>
      </div>
    </Link>
  );
}

export function TasksTable({ rows, filtered }: { rows: CourierTask[]; filtered: boolean }) {
  return (
    <DataTable
      caption="Your tasks"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={taskHref}
      defaultSort={{ key: "updatedAt", order: "desc" }}
      renderMobileCard={MobileCard}
      emptyState={
        filtered ? (
          <EmptyState
            variant="plain"
            icon={PackageSearch}
            title="No tasks match"
            description="Try another search or status, or clear the filters to see your active tasks."
            action={
              <Button asChild variant="outline">
                <Link href="/courier">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            variant="plain"
            icon={ClipboardCheck}
            title="No active tasks"
            description="You're all caught up. New pickups appear here as soon as they're assigned to you."
          />
        )
      }
    />
  );
}
