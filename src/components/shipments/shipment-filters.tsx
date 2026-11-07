"use client";

// Client: search box and filters that write to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { SHIPMENT_PAYMENT_STATUS_META, SHIPMENT_STATUS_META } from "@/lib/status";
import { SHIPMENT_PAYMENT_STATUSES, SHIPMENT_STATUSES } from "@/types";

const ALL = "all";

export function ShipmentFilters() {
  const { get, set } = useUrlState();
  const status = get("status") ?? ALL;
  const payment = get("paymentStatus") ?? ALL;
  const active = status !== ALL || payment !== ALL || Boolean(get("searchTerm"));

  return (
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
        <Select value={payment} onValueChange={(value) => set({ paymentStatus: value === ALL ? null : value })}>
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by payment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any payment</SelectItem>
            {SHIPMENT_PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {SHIPMENT_PAYMENT_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {active ? (
        <Button variant="ghost" onClick={() => set({ status: null, paymentStatus: null, searchTerm: null })} className="self-start md:self-auto">
          <X aria-hidden="true" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
