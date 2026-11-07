"use client";

// Client: search, status, courier and date filters that write to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { SHIPMENT_STATUSES } from "@/types";
import { DateRangeFilter } from "./date-range-filter";

const ALL = "all";

export function AdminShipmentFilters({ couriers }: { couriers: { id: string; name: string }[] }) {
  const { get, set } = useUrlState();
  const status = get("status") ?? ALL;
  const courier = get("courierId") ?? ALL;
  const active = ["status", "courierId", "searchTerm", "fromDate", "toDate"].some((k) => get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput label="Search shipments" placeholder="Tracking ID, receiver or phone" className="md:max-w-sm" />
        <div className="grid grid-cols-2 gap-3 md:flex">
          <Select value={status} onValueChange={(value) => set({ status: value === ALL ? null : value })}>
            <SelectTrigger className="w-full md:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {SHIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SHIPMENT_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courier} onValueChange={(value) => set({ courierId: value === ALL ? null : value })}>
            <SelectTrigger className="w-full md:w-48" aria-label="Filter by courier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any courier</SelectItem>
              {couriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DateRangeFilter />
        {active ? (
          <Button variant="ghost" onClick={() => set({ status: null, courierId: null, searchTerm: null, fromDate: null, toDate: null })} className="self-start sm:self-auto">
            <X aria-hidden="true" /> Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
