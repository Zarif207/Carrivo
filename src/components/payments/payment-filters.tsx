"use client";

// Client: the status filter writes to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { PAYMENT_STATUS_META } from "@/lib/status";
import { PAYMENT_STATUSES } from "@/types";

const ALL = "all";

/** GET /payments/my filters by status only (no search). */
export function PaymentFilters() {
  const { get, set } = useUrlState();
  const status = get("status") ?? ALL;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status} onValueChange={(value) => set({ status: value === ALL ? null : value })}>
        <SelectTrigger className="w-full sm:w-56" aria-label="Filter by payment status">
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
      {status !== ALL ? (
        <Button variant="ghost" onClick={() => set({ status: null })}>
          <X aria-hidden="true" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
