"use client";

// Client: payout-status filter that writes to the URL (the server re-renders the list).
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { EARNING_STATUS_META } from "@/lib/status";
import { EARNING_STATUSES } from "@/types";

const ALL = "all";

export function EarningFilters() {
  const { get, set } = useUrlState();
  const status = get("status") ?? ALL;
  return (
    <Select value={status} onValueChange={(value) => set({ status: value === ALL ? null : value })}>
      <SelectTrigger className="w-full sm:w-52" aria-label="Filter by payout status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All payouts</SelectItem>
        {EARNING_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {EARNING_STATUS_META[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
