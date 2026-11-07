"use client";

// Client: search box and status filter that write to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { COURIER_TASK_STATUSES } from "@/types";

const ACTIVE = "active";

export function TaskFilters() {
  const { get, set } = useUrlState();
  const status = get("status") ?? ACTIVE;
  const filtered = status !== ACTIVE || Boolean(get("searchTerm"));

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <SearchInput label="Search tasks" placeholder="Tracking ID, receiver or phone" className="md:max-w-sm" />
      <Select value={status} onValueChange={(value) => set({ status: value === ACTIVE ? null : value })}>
        <SelectTrigger className="w-full md:w-56" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ACTIVE}>All active tasks</SelectItem>
          {COURIER_TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {SHIPMENT_STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filtered ? (
        <Button variant="ghost" onClick={() => set({ status: null, searchTerm: null })} className="self-start md:self-auto">
          <X aria-hidden="true" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
