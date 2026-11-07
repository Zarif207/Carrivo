"use client";

// Client: action, record type, user and date filters that write to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { AUDIT_ENTITY_LABELS, auditActionLabel } from "@/lib/audit";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/types";
import { DateRangeFilter } from "./date-range-filter";

const ALL = "all";

export function AuditFilters({ users }: { users: { id: string; name: string; role: string }[] }) {
  const { get, set } = useUrlState();
  const action = get("action") ?? ALL;
  const entity = get("entityType") ?? ALL;
  const actor = get("actorId") ?? ALL;
  const active = ["action", "entityType", "actorId", "fromDate", "toDate"].some((k) => get(k));
  // A user picked from a row may not be in the first 100: keep the current value selectable.
  const actorKnown = actor === ALL || users.some((u) => u.id === actor);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={action} onValueChange={(v) => set({ action: v === ALL ? null : v })}>
          <SelectTrigger className="w-full" aria-label="Filter by action">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {auditActionLabel(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entity} onValueChange={(v) => set({ entityType: v === ALL ? null : v })}>
          <SelectTrigger className="w-full" aria-label="Filter by record type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All record types</SelectItem>
            {AUDIT_ENTITY_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {AUDIT_ENTITY_LABELS[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actor} onValueChange={(v) => set({ actorId: v === ALL ? null : v })}>
          <SelectTrigger className="w-full" aria-label="Filter by user">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Anyone</SelectItem>
            {!actorKnown ? <SelectItem value={actor}>Selected user</SelectItem> : null}
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.role.toLowerCase()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DateRangeFilter />
        {active ? (
          <Button variant="ghost" onClick={() => set({ action: null, entityType: null, actorId: null, fromDate: null, toDate: null })} className="self-start sm:self-auto">
            <X aria-hidden="true" /> Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
