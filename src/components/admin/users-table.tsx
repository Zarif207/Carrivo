"use client";

// Client: rows open the user sheet through ?view=<id> (URL-synced, so it survives refresh and Back).
import { UsersRound } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import { VEHICLE_NAMES } from "@/lib/status";
import type { AdminUser } from "@/types";

function CourierInfo({ user }: { user: AdminUser }) {
  const p = user.courierProfile;
  if (!p) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="min-w-0 text-sm">
      <p className="truncate">{p.hub?.name ?? p.zone.name}</p>
      <p className="truncate text-xs text-muted-foreground">
        {VEHICLE_NAMES[p.vehicleType]}, {p.isAvailable ? "available" : "paused"}
      </p>
    </div>
  );
}

export function UsersTable({ rows, filtered }: { rows: AdminUser[]; filtered: boolean }) {
  const { hrefWith } = useUrlState();
  const viewHref = (row: AdminUser) => hrefWith({ view: row.id });

  const columns: DataTableColumn<AdminUser>[] = [
    {
      id: "name",
      header: "Name",
      sortKey: "name",
      cell: (row) => (
        <div className="max-w-56 min-w-0">
          <Link href={viewHref(row)} scroll={false} className="block truncate rounded font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
            {row.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { id: "role", header: "Role", sortKey: "role", cell: (row) => <StatusBadge kind="role" status={row.role} size="sm" /> },
    { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="user" status={row.status} size="sm" /> },
    { id: "courier", header: "Hub and vehicle", className: "hidden lg:table-cell", headerClassName: "hidden lg:table-cell", cell: (row) => <CourierInfo user={row} /> },
    {
      id: "phone",
      header: "Phone",
      className: "hidden 2xl:table-cell",
      headerClassName: "hidden 2xl:table-cell",
      cell: (row) => (row.phone ? <span className="font-id text-sm whitespace-nowrap">{row.phone}</span> : <span className="text-muted-foreground">-</span>),
    },
    { id: "created", header: "Joined", sortKey: "createdAt", className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell", cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span> },
  ];

  return (
    <DataTable
      caption="Users"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      rowHref={viewHref}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={(row) => (
        <Link href={viewHref(row)} scroll={false} className="block space-y-1.5 p-4 outline-none focus-visible:bg-accent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.email}</p>
            </div>
            <StatusBadge kind="user" status={row.status} size="sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="role" status={row.role} size="sm" />
            {row.courierProfile ? (
              <span className="text-xs text-muted-foreground">
                {row.courierProfile.hub?.name ?? row.courierProfile.zone.name}, {row.courierProfile.isAvailable ? "available" : "paused"}
              </span>
            ) : null}
          </div>
        </Link>
      )}
      emptyState={
        <EmptyState
          variant="plain"
          icon={UsersRound}
          title={filtered ? "No users match" : "No users yet"}
          description={filtered ? "Try another name, email or phone, or clear the filters." : "People appear here when they sign up."}
          action={
            filtered ? (
              <Button asChild variant="outline">
                <Link href="/admin/users">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      }
    />
  );
}
