"use client";

// Client: shows the live quote for the current step 2 values.
import { Calculator, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { formatMoney, formatWeight } from "@/lib/format";
import type { useEstimate } from "@/lib/queries/pricing";

type EstimateQuery = ReturnType<typeof useEstimate>;

export function EstimateCard({ query, ready }: { query: EstimateQuery; ready: boolean }) {
  return (
    <section aria-live="polite" aria-busy={query.isFetching} aria-label="Price" className="rounded-xl bg-surface p-5 ring-1 ring-border">
      {!ready ? (
        <div className="flex items-start gap-3 text-muted-foreground">
          <Calculator className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>Choose both zones, the weight and a service to see the price.</p>
        </div>
      ) : query.isFetching && !query.data ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : query.isError ? (
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="font-bold">Not available</p>
            <p className="text-sm text-muted-foreground">
              {ApiError.isApiError(query.error) ? query.error.message : "The price couldn't be worked out. Try again."}
            </p>
          </div>
        </div>
      ) : query.data ? (
        <div className={query.isFetching ? "opacity-60 transition-opacity" : undefined}>
          <p className="text-sm font-semibold text-muted-foreground">Price</p>
          <p className="text-[2.25rem] leading-tight font-extrabold tracking-tight text-brand tabular">{formatMoney(query.data.total)}</p>
          <p className="text-sm text-muted-foreground">
            {formatMoney(query.data.baseFee)} for the first {formatWeight(query.data.baseWeightLb)}
            {Number(query.data.chargeableExtraLb) > 0
              ? `, plus ${Number(query.data.chargeableExtraLb)} lb × ${formatMoney(query.data.perLbFee)}`
              : ""}
          </p>
        </div>
      ) : null}
    </section>
  );
}
