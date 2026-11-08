"use client";

// Client: two native date inputs that write ?fromDate= / ?toDate= (YYYY-MM-DD, business-time-zone days).
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUrlState } from "@/hooks/use-url-state";

export function DateRangeFilter({ fromKey = "fromDate", toKey = "toDate" }: { fromKey?: string; toKey?: string }) {
  const { get, set } = useUrlState();
  const from = get(fromKey) ?? "";
  const to = get(toKey) ?? "";
  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor={`${fromKey}-input`} className="text-xs text-muted-foreground">
          From
        </Label>
        <Input id={`${fromKey}-input`} type="date" value={from} max={to || undefined} onChange={(e) => set({ [fromKey]: e.target.value || null })} className="sm:w-40" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${toKey}-input`} className="text-xs text-muted-foreground">
          To
        </Label>
        <Input id={`${toKey}-input`} type="date" value={to} min={from || undefined} onChange={(e) => set({ [toKey]: e.target.value || null })} className="sm:w-40" />
      </div>
    </div>
  );
}
