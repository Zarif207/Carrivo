"use client";

// Client: the three settings tables with their edit / deactivate / delete actions.
import { Building2, MapPinned, Pencil, Tags } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatMoney, formatWeight } from "@/lib/format";
import { SERVICE_NAMES, TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Hub, PricingRule, Zone } from "@/types";
import { HubDialog } from "./hub-dialog";
import { PricingDialog } from "./pricing-dialog";
import { RecordAction } from "./record-action";
import { ZoneDialog } from "./zone-dialog";

type ZoneOption = Pick<Zone, "id" | "name" | "isActive">;

function ActiveBadge({ active }: { active: boolean }) {
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold whitespace-nowrap", active ? TONE_CLASSES.green : TONE_CLASSES.stone)}>{active ? "Active" : "Inactive"}</span>;
}

/** Forwards props and ref so it can be a DialogTrigger `asChild` (the trigger passes onClick, aria-*). */
function EditButton({ name, ...props }: { name: string } & ComponentProps<typeof Button>) {
  return (
    <Button size="sm" variant="ghost" aria-label={`Edit ${name}`} {...props}>
      <Pencil aria-hidden="true" />
      <span className="hidden xl:inline">Edit</span>
    </Button>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow="ADMIN">
      <div className="flex justify-end gap-1">{children}</div>
    </RoleGate>
  );
}

const code = (value: string) => <span className="font-id text-sm">{value}</span>;

export function ZonesTable({ rows, filtered }: { rows: Zone[]; filtered: boolean }) {
  const columns: DataTableColumn<Zone>[] = [
    { id: "name", header: "Zone", sortKey: "name", cell: (z) => <span className="font-semibold">{z.name}</span> },
    { id: "code", header: "Code", sortKey: "code", cell: (z) => code(z.code) },
    { id: "desc", header: "Description", className: "hidden lg:table-cell", headerClassName: "hidden lg:table-cell", cell: (z) => <span className="line-clamp-2 max-w-sm text-sm text-muted-foreground">{z.description ?? "-"}</span> },
    { id: "status", header: "Status", cell: (z) => <ActiveBadge active={z.isActive} /> },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (z) => (
        <Actions>
          <ZoneDialog zone={z} trigger={<EditButton name={z.name} />} />
          <RecordAction kind="zone" id={z.id} name={z.name} action={z.isActive ? "deactivate" : "reactivate"} />
          <RecordAction kind="zone" id={z.id} name={z.name} action="delete" />
        </Actions>
      ),
    },
  ];
  return (
    <DataTable
      caption="Zones"
      columns={columns}
      data={rows}
      getRowId={(z) => z.id}
      defaultSort={{ key: "name", order: "asc" }}
      renderMobileCard={(z) => (
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">
              {z.name} <span className="font-id text-xs text-muted-foreground">{z.code}</span>
            </p>
            <ActiveBadge active={z.isActive} />
          </div>
          {z.description ? <p className="text-sm text-muted-foreground">{z.description}</p> : null}
          <Actions>
            <ZoneDialog zone={z} trigger={<EditButton name={z.name} />} />
            <RecordAction kind="zone" id={z.id} name={z.name} action={z.isActive ? "deactivate" : "reactivate"} />
            <RecordAction kind="zone" id={z.id} name={z.name} action="delete" />
          </Actions>
        </div>
      )}
      emptyState={<EmptyState variant="plain" icon={MapPinned} title={filtered ? "No zones match" : "No zones yet"} description={filtered ? "Try another name or code." : "Create the first delivery zone."} />}
    />
  );
}

export function HubsTable({ rows, zones, filtered }: { rows: Hub[]; zones: ZoneOption[]; filtered: boolean }) {
  const actions = (h: Hub) => (
    <Actions>
      <HubDialog hub={h} zones={zones} trigger={<EditButton name={h.name} />} />
      <RecordAction kind="hub" id={h.id} name={h.name} action={h.isActive ? "deactivate" : "reactivate"} />
      <RecordAction kind="hub" id={h.id} name={h.name} action="delete" />
    </Actions>
  );
  const columns: DataTableColumn<Hub>[] = [
    {
      id: "name",
      header: "Hub",
      sortKey: "name",
      cell: (h) => (
        <div className="max-w-56 min-w-0">
          <p className="truncate font-semibold">{h.name}</p>
          <p className="truncate text-xs text-muted-foreground">{h.address}</p>
        </div>
      ),
    },
    { id: "code", header: "Code", sortKey: "code", className: "hidden md:table-cell", headerClassName: "hidden md:table-cell", cell: (h) => code(h.code) },
    { id: "zone", header: "Zone", cell: (h) => h.zone.name },
    { id: "city", header: "City", sortKey: "city", className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell", cell: (h) => h.city },
    { id: "status", header: "Status", cell: (h) => <ActiveBadge active={h.isActive} /> },
    { id: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: actions },
  ];
  return (
    <DataTable
      caption="Hubs"
      columns={columns}
      data={rows}
      getRowId={(h) => h.id}
      defaultSort={{ key: "name", order: "asc" }}
      renderMobileCard={(h) => (
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">
              {h.name} <span className="font-id text-xs text-muted-foreground">{h.code}</span>
            </p>
            <ActiveBadge active={h.isActive} />
          </div>
          <p className="text-sm text-muted-foreground">
            {h.zone.name}, {h.address}, {h.city}
          </p>
          {actions(h)}
        </div>
      )}
      emptyState={<EmptyState variant="plain" icon={Building2} title={filtered ? "No hubs match" : "No hubs yet"} description={filtered ? "Try another name, code or city." : "Add a hub to a zone."} />}
    />
  );
}

const route = (r: PricingRule) => (r.originZone && r.destinationZone ? `${r.originZone.name} to ${r.destinationZone.name}` : "Any route (default)");

export function PricingTable({ rows, zones, filtered }: { rows: PricingRule[]; zones: ZoneOption[]; filtered: boolean }) {
  const actions = (r: PricingRule) => (
    <Actions>
      <PricingDialog rule={r} zones={zones} trigger={<EditButton name={r.name} />} />
      <RecordAction kind="pricing" id={r.id} name={r.name} action={r.isActive ? "deactivate" : "reactivate"} />
      <RecordAction kind="pricing" id={r.id} name={r.name} action="delete" />
    </Actions>
  );
  const price = (r: PricingRule) => (
    <span className="text-sm whitespace-nowrap tabular">
      {formatMoney(r.baseFee)} for {formatWeight(r.baseWeightKg)}, +{formatMoney(r.perKgFee)}/kg
    </span>
  );
  const columns: DataTableColumn<PricingRule>[] = [
    {
      id: "name",
      header: "Rule",
      sortKey: "name",
      cell: (r) => (
        <div className="max-w-56 min-w-0">
          <p className="truncate font-semibold">{r.name}</p>
          <p className="truncate text-xs text-muted-foreground">{route(r)}</p>
        </div>
      ),
    },
    { id: "service", header: "Service", sortKey: "serviceType", cell: (r) => SERVICE_NAMES[r.serviceType] },
    { id: "price", header: "Price", sortKey: "baseFee", cell: price },
    { id: "cap", header: "Weight cap", className: "hidden 2xl:table-cell", headerClassName: "hidden 2xl:table-cell", cell: (r) => (r.maxWeightKg ? formatWeight(r.maxWeightKg) : "None") },
    { id: "status", header: "Status", cell: (r) => <ActiveBadge active={r.isActive} /> },
    { id: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: actions },
  ];
  return (
    <DataTable
      caption="Pricing rules"
      columns={columns}
      data={rows}
      getRowId={(r) => r.id}
      defaultSort={{ key: "createdAt", order: "desc" }}
      renderMobileCard={(r) => (
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {SERVICE_NAMES[r.serviceType]}, {route(r)}
              </p>
            </div>
            <ActiveBadge active={r.isActive} />
          </div>
          {price(r)}
          {actions(r)}
        </div>
      )}
      emptyState={<EmptyState variant="plain" icon={Tags} title={filtered ? "No rules match" : "No pricing rules"} description={filtered ? "Try another name." : "Every service needs a default rule before it can be priced."} />}
    />
  );
}
