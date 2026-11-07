"use client";

// Client: status, needs-review and date filters that write to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUrlState } from "@/hooks/use-url-state";
import { PAYMENT_STATUS_META } from "@/lib/status";
import { PAYMENT_STATUSES } from "@/types";
import { DateRangeFilter } from "./date-range-filter";

const ALL = "all";

export function AdminPaymentFilters() {
  const { get, set } = useUrlState();
  const status = get("status") ?? ALL;
  const review = get("requiresReview") === "true";
  const active = ["status", "requiresReview", "fromDate", "toDate"].some((k) => get(k));
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select value={status} onValueChange={(v) => set({ status: v === ALL ? null : v })}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by payment status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex h-11 items-center gap-2.5">
          <Switch id="needs-review" checked={review} onCheckedChange={(on) => set({ requiresReview: on ? "true" : null })} />
          <Label htmlFor="needs-review">Needs review only</Label>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <DateRangeFilter />
        {active ? (
          <Button variant="ghost" onClick={() => set({ status: null, requiresReview: null, fromDate: null, toDate: null })} className="self-start sm:self-auto">
            <X aria-hidden="true" /> Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
