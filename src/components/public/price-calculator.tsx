"use client";

// Client: interactive quote form; calls the estimatePrice server action.
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Calculator, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { estimatePrice, type EstimateResult } from "@/app/(public)/pricing/actions";
import { NumberField, SelectField } from "@/components/shared/form-fields";
import { ServiceField } from "@/components/shared/service-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatWeight } from "@/lib/format";
import { describePriceProblem, serviceLabel } from "@/lib/pricing/services";
import { sortZones, zoneOptions } from "@/lib/zones";
import { estimateSchema, type EstimateFormValues, type EstimateValues } from "@/lib/validation/public";
import type { Zone } from "@/types";

interface Quote {
  input: EstimateValues;
  result: EstimateResult;
}

export function PriceCalculator({ zones: unsorted }: { zones: Zone[] }) {
  const zones = sortZones(unsorted);
  const form = useForm<EstimateFormValues, unknown, EstimateValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      originZoneId: zones[0]?.id ?? "",
      destinationZoneId: zones[1]?.id ?? zones[0]?.id ?? "",
      weightLb: undefined,
      serviceType: "STANDARD",
    },
  });
  const [origin, destination] = useWatch({ control: form.control, name: ["originZoneId", "destinationZoneId"] });

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? "Unknown zone";
  const zoneAreas = (id: string) => zones.find((z) => z.id === id)?.description ?? undefined;

  const quote = useMutation({
    mutationFn: async (input: EstimateValues): Promise<Quote> => ({ input, result: await estimatePrice(input) }),
    onSuccess: ({ result }) => {
      if (result.ok) return;
      if (result.kind === "validation" && result.fieldErrors) {
        for (const [name, message] of Object.entries(result.fieldErrors)) {
          if (name in estimateSchema.shape) form.setError(name as keyof EstimateValues, { message });
        }
      }
      if (result.kind === "error") toast.error(result.message);
    },
    onError: () => toast.error("Pricing is unavailable right now. Try again in a moment."),
  });

  const options = zoneOptions(zones);
  const data = quote.data;
  const problem =
    data && !data.result.ok && data.result.kind === "unavailable"
      ? describePriceProblem(data.result.message, {
          ...data.input,
          originName: zoneName(data.input.originZoneId),
          destinationName: zoneName(data.input.destinationZoneId),
        })
      : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => quote.mutate(values))}
          noValidate
          className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8"
          aria-describedby="calculator-note"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField control={form.control} name="originZoneId" label="From" options={options} placeholder="Choose a zone" description={zoneAreas(origin)} />
            <SelectField control={form.control} name="destinationZoneId" label="To" options={options} placeholder="Choose a zone" description={zoneAreas(destination)} />
          </div>

          <NumberField control={form.control} name="weightLb" label="Weight" suffix="lb" step="0.01" min={0} placeholder="e.g. 5.5" className="sm:max-w-56" />

          <ServiceField />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" disabled={quote.isPending}>
              {quote.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Calculator aria-hidden="true" />}
              Get price
            </Button>
            <p id="calculator-note" className="text-sm text-muted-foreground">
              Prices are in US dollars and calculated by the same rules as a real booking.
            </p>
          </div>
        </form>
      </Form>

      <section aria-live="polite" aria-busy={quote.isPending} aria-label="Quote" className="flex min-h-[22rem] flex-col rounded-2xl bg-card p-6 shadow-card sm:p-8">
        {quote.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-14 w-36" />
            <Skeleton className="h-4 w-56" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        ) : data?.result.ok ? (
          <QuoteResult quote={data} origin={zoneName(data.input.originZoneId)} destination={zoneName(data.input.destinationZoneId)} />
        ) : problem ? (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-warning-soft text-warning">
              <Info className="size-6" aria-hidden="true" />
            </span>
            <p className="text-xl font-bold">{problem.title}</p>
            <p className="text-muted-foreground">{problem.message}</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-3 text-muted-foreground">
            <span className="grid size-12 place-items-center rounded-full bg-secondary text-foreground">
              <Calculator className="size-6" aria-hidden="true" />
            </span>
            <p className="text-xl font-bold text-foreground">Your price appears here</p>
            <p>Choose the zones, enter the weight and pick a service.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function QuoteResult({ quote, origin, destination }: { quote: Quote; origin: string; destination: string }) {
  if (!quote.result.ok) return null;
  const e = quote.result.estimate;
  const extraLb = Number(e.chargeableExtraLb);
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-muted-foreground">
        {serviceLabel(e.serviceType)}, {formatWeight(e.weightLb)}, {origin} to {destination}
      </p>
      <p className="pt-2 text-[3.5rem] leading-none font-extrabold tracking-tight text-brand tabular">{formatMoney(e.total)}</p>
      <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted-foreground">Base fee (first {formatWeight(e.baseWeightLb)})</dt>
          <dd className="font-semibold tabular">{formatMoney(e.baseFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted-foreground">
            Extra weight ({extraLb} lb × {formatMoney(e.perLbFee)})
          </dt>
          <dd className="font-semibold tabular">{formatMoney(e.weightCharge)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-extrabold tabular">{formatMoney(e.total)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">Extra weight is charged per started pound.</p>
      <div className="mt-auto pt-6">
        <Button asChild variant="outline" size="lg">
          <Link href="/register">
            Book this shipment <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
