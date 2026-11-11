"use client";

// Client: rows open the detail sheet through ?view=<id> (URL-synced, so it survives refresh and Back).
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";
import { APPLICATION_TAB_LABELS, type ApplicationTab } from "@/lib/admin/courier-application-tabs";
import { formatDate, formatDateTime } from "@/lib/format";
import { VEHICLE_NAMES, WORK_AVAILABILITY_NAMES } from "@/lib/status";
import type { AdminCourierApplication } from "@/types";

const LINK = "block truncate rounded font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

export function ApplicationsTable({ rows, tab, filtered }: { rows: AdminCourierApplication[]; tab: ApplicationTab; filtered: boolean }) {
  const { hrefWith } = useUrlState();
  const viewHref = (row: AdminCourierApplication) => hrefWith({ view: row.id });

  const columns: DataTableColumn<AdminCourierApplication>[] = [
    {
      id: "applicant",
      header: "Applicant",
      cell: (row) => (
        <div className="max-w-60 min-w-0">
          <Link href={viewHref(row)} scroll={false} className={LINK}>
            {row.user.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    { id: "phone", header: "Phone", className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell", cell: (row) => <span className="font-id text-sm whitespace-nowrap">{row.phone}</span> },
    { id: "zone", header: "Zone", cell: (row) => (row.preferredZone ? <span className="whitespace-nowrap">{row.preferredZone.name}</span> : <span className="text-muted-foreground">Any</span>) },
    {
      id: "vehicle",
      header: "Vehicle",
      className: "hidden lg:table-cell",
      headerClassName: "hidden lg:table-cell",
      cell: (row) => (
        <div className="text-sm">
          <p>{VEHICLE_NAMES[row.vehicleType]}</p>
          <p className="text-xs text-muted-foreground">{WORK_AVAILABILITY_NAMES[row.availability]}</p>
        </div>
      ),
    },
    {
      id: "submitted",
      header: "Submitted",
      sortKey: "createdAt",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </time>
      ),
    },
    { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="courier-application" status={row.status} size="sm" /> },
  ];

  const label = APPLICATION_TAB_LABELS[tab].toLowerCase();

  return (
    <DataTable
      caption="Courier applications"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={viewHref}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={(row) => (
        <Link href={viewHref(row)} scroll={false} className="block space-y-1.5 p-4 outline-none focus-visible:bg-accent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.user.email}</p>
            </div>
            <StatusBadge kind="courier-application" status={row.status} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            {VEHICLE_NAMES[row.vehicleType]}, {row.preferredZone?.name ?? "any zone"}, sent {formatDate(row.createdAt)}
          </p>
        </Link>
      )}
      emptyState={
        <EmptyState
          variant="plain"
          icon={ClipboardList}
          title={filtered ? "No applications match" : tab === "PENDING" ? "Nothing waiting for review" : tab === "all" ? "No applications yet" : `No ${label} applications`}
          description={
            filtered
              ? "Try another name, email or phone, or clear the filters."
              : tab === "PENDING"
                ? "New applications from customers appear here, and in your notifications."
                : "Applications appear here once customers apply."
          }
          action={
            filtered ? (
              <Button asChild variant="outline">
                <Link href={tab === "PENDING" ? "/admin/courier-applications" : `/admin/courier-applications?status=${tab}`}>Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      }
    />
  );
}
