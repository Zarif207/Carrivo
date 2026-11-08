"use client";

// Client: the admin's next-step buttons for one shipment, one confirm dialog (courier picker, hub picker,
// note) and an optimistic status that rolls back if the API refuses.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { CanMutate } from "@/components/auth/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiFetchList } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { adminNextActions, type AdminAction } from "@/lib/admin/shipment-actions";
import { SHIPMENT_STATUS_META, VEHICLE_NAMES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { CourierListItem, Hub, ShipmentDetail, ShipmentPaymentStatus, ShipmentStatus } from "@/types";

export interface AdminShipmentRef {
  id: string;
  trackingId: string;
  status: ShipmentStatus;
  paymentStatus: ShipmentPaymentStatus;
  failedAttempts: number;
  courier: { id: string; name: string } | null;
  originZone: { id: string; name: string };
  originHubId: string;
  destinationHubId: string;
}

interface Props {
  shipment: AdminShipmentRef;
  originHubs: Pick<Hub, "id" | "name">[];
  destinationHubs: Pick<Hub, "id" | "name">[];
}

const noteOk = (note: string) => note === "" || (note.length >= 3 && note.length <= 500);

function errorText(error: unknown): string {
  if (!ApiError.isApiError(error)) return "Something went wrong. Try again.";
  if (error.isNetworkError) return "The server didn't answer. Nothing changed; try again.";
  const field = error.errors.find((e) => e.message && e.message !== error.message)?.message;
  return field ? `${error.message}: ${field}` : error.message;
}

/** Couriers who can take the shipment: active, available, in the origin zone (contract §7 assign rules). */
function CourierPicker({ zone, excludeId, value, onChange }: { zone: { id: string; name: string }; excludeId?: string; value: string; onChange: (id: string) => void }) {
  const name = useId();
  const query = useQuery({
    queryKey: queryKeys.couriers.list({ zoneId: zone.id, available: "true", limit: 100, sortBy: "name", sortOrder: "asc" }),
    queryFn: () => apiFetchList<CourierListItem>(endpoints.couriers.list, { query: { zoneId: zone.id, available: "true", limit: 100, sortBy: "name", sortOrder: "asc" } }),
    staleTime: 30_000,
  });
  const couriers = (query.data?.data ?? []).filter((c) => c.id !== excludeId);

  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    );
  }
  if (query.isError) return <p className="text-sm font-medium text-danger">Couldn&apos;t load couriers: {errorText(query.error)}</p>;
  if (couriers.length === 0) {
    return <p className="rounded-lg bg-secondary px-3 py-2.5 text-sm">No other available couriers work in {zone.name} right now. Couriers who paused themselves don&apos;t show here.</p>;
  }
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Available in {zone.name}</legend>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {couriers.map((c) => (
          <label
            key={c.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg p-3 ring-1 ring-border transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              value === c.id && "bg-accent ring-2 ring-brand",
            )}
          >
            <input type="radio" name={name} value={c.id} checked={value === c.id} onChange={() => onChange(c.id)} className="size-4 accent-[var(--brand)]" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {[c.courierProfile?.hub?.name, c.courierProfile ? VEHICLE_NAMES[c.courierProfile.vehicleType] : null].filter(Boolean).join(", ")}
              </span>
            </span>
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular">
              {c.activeTaskCount} active {c.activeTaskCount === 1 ? "task" : "tasks"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AdminShipmentActions({ shipment, originHubs, destinationHubs }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(shipment.status);
  const [courierName, setCourierName] = useState(shipment.courier?.name ?? null);
  const [active, setActive] = useState<AdminAction | null>(null);
  const [note, setNote] = useState("");
  const [courierId, setCourierId] = useState("");
  const [hubId, setHubId] = useState("");

  // A fresh server render (router.refresh) brings new props: follow them.
  const [seen, setSeen] = useState(shipment);
  if (seen.status !== shipment.status || seen.courier?.id !== shipment.courier?.id) {
    setSeen(shipment);
    setStatus(shipment.status);
    setCourierName(shipment.courier?.name ?? null);
  }

  const actions = adminNextActions(status, shipment.failedAttempts);
  const trimmed = note.trim();
  const needsCourier = active?.kind === "assign" || active?.kind === "reassign";
  const hubs = active?.hub === "origin" ? originHubs : active?.hub === "destination" ? destinationHubs : [];

  const open = (action: AdminAction) => {
    setNote("");
    setCourierId("");
    setHubId(action.hub === "origin" ? shipment.originHubId : action.hub === "destination" ? shipment.destinationHubId : "");
    setActive(action);
  };

  const confirm = async () => {
    if (!active) return;
    const previous = { status, courierName };
    const body = trimmed ? { note: trimmed } : {};
    setStatus(active.optimistic); // optimistic
    let unassigned = false;
    try {
      switch (active.kind) {
        case "assign":
          await apiFetch<ShipmentDetail>(endpoints.shipments.assign(shipment.id), { method: "POST", body: { courierId, ...body } });
          break;
        case "reassign":
          // The API has no single "reassign": unassign, then assign the new courier.
          await apiFetch<ShipmentDetail>(endpoints.shipments.unassign(shipment.id), { method: "POST", body: { note: `Reassigning from ${previous.courierName ?? "the previous courier"}` } });
          unassigned = true;
          await apiFetch<ShipmentDetail>(endpoints.shipments.assign(shipment.id), { method: "POST", body: { courierId, ...body } });
          break;
        case "unassign":
          setCourierName(null);
          await apiFetch<ShipmentDetail>(endpoints.shipments.unassign(shipment.id), { method: "POST", body });
          break;
        case "cancel":
          await apiFetch<ShipmentDetail>(endpoints.shipments.cancel(shipment.id), { method: "POST", body: trimmed ? { reason: trimmed } : {} });
          break;
        case "status":
          await apiFetch<ShipmentDetail>(endpoints.shipments.status(shipment.id), {
            method: "PATCH",
            body: { status: active.target, ...body, ...(active.hub && hubId ? { hubId } : {}) },
          });
          break;
      }
      toast.success(active.done, { description: shipment.trackingId });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      startTransition(() => router.refresh());
    } catch (error) {
      if (unassigned) {
        // Half done: the old courier is off, the new one isn't on. Show the true state and let them pick again.
        setStatus("PICKUP_SCHEDULED");
        setCourierName(null);
        toast.error("The old courier was removed, but the new one couldn't be assigned", { description: errorText(error) });
        setActive(adminNextActions("PICKUP_SCHEDULED", shipment.failedAttempts).find((a) => a.kind === "assign") ?? null);
        startTransition(() => router.refresh());
      } else {
        setStatus(previous.status); // rollback
        setCourierName(previous.courierName);
        toast.error(`Couldn't ${active.label.toLowerCase()}`, { description: errorText(error) });
      }
      throw error; // keeps the dialog open with its inputs
    }
  };

  const canConfirm = noteOk(trimmed) && (!needsCourier || courierId !== "");

  return (
    <div className="flex flex-col gap-5 rounded-xl bg-card p-6 shadow-card lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="shipment" status={status} />
          <StatusBadge kind="shipment-payment" status={shipment.paymentStatus} />
        </div>
        <p className="text-muted-foreground" aria-live="polite">
          {SHIPMENT_STATUS_META[status].description} {courierName ? `Courier: ${courierName}.` : status === "PICKUP_SCHEDULED" ? "No courier yet." : null}
        </p>
      </div>

      <CanMutate readOnly={<p className="text-sm text-muted-foreground">View-only access: shipment actions are hidden.</p>}>
        {actions.length ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <Button key={a.key} variant={a.tone === "destructive" || a.kind === "unassign" ? "outline" : "default"} onClick={() => open(a)} className="w-full sm:w-auto">
                  <Icon aria-hidden="true" /> {a.label}
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{status === "OUT_FOR_DELIVERY" || status === "COURIER_ASSIGNED" ? "Waiting on the courier." : "No admin steps from here."}</p>
        )}
      </CanMutate>

      {/* One dialog, mounted while open: the optimistic status hides the buttons, never the dialog. */}
      {active ? (
        <ConfirmDialog
          open
          onOpenChange={(next) => {
            if (!next) setActive(null);
          }}
          title={active.title}
          description={active.description}
          confirmLabel={active.confirmLabel}
          cancelLabel="Go back"
          tone={active.tone}
          confirmDisabled={!canConfirm}
          onConfirm={confirm}
        >
          <div className="space-y-4">
            {needsCourier ? <CourierPicker zone={shipment.originZone} excludeId={active.kind === "reassign" ? shipment.courier?.id : undefined} value={courierId} onChange={setCourierId} /> : null}
            {active.hub && hubs.length ? (
              <div className="space-y-2">
                <Label htmlFor="hub-select">Hub</Label>
                <Select value={hubId} onValueChange={setHubId}>
                  <SelectTrigger id="hub-select" className="w-full">
                    <SelectValue placeholder="Planned hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {hubs.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                        {h.id === (active.hub === "origin" ? shipment.originHubId : shipment.destinationHubId) ? " (planned)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="admin-note">
                {active.kind === "cancel" ? "Reason" : "Note"} <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="admin-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} aria-invalid={!noteOk(trimmed) || undefined} aria-describedby="admin-note-hint" />
              <p id="admin-note-hint" className={noteOk(trimmed) ? "text-xs text-muted-foreground" : "text-xs font-medium text-danger"}>
                {noteOk(trimmed) ? "Saved on the shipment's history. 3 to 500 characters." : "Write at least 3 characters, or leave it empty."}
              </p>
            </div>
          </div>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
