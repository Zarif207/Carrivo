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
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatWeight } from "@/lib/format";
import { estimateSchema, type EstimateFormValues, type EstimateValues } from "@/lib/validation/public";
import type { ServiceType, Zone } from "@/types";

export const SERVICE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "SAME_DAY", label: "Same day" },
] as const satisfies readonly { value: ServiceType; label: string }[];

const SERVICE_HINTS: Record<ServiceType, string> = {
  STANDARD: "The everyday option for parcels that aren't urgent.",
  EXPRESS: "Faster and higher priced, for parcels that need to arrive sooner.",
  SAME_DAY: "Picked up and delivered the same day, within one zone only.",
};

const serviceLabel = (value: ServiceType) => SERVICE_OPTIONS.find((o) => o.value === value)?.label ?? value;

interface Quote {
  input: EstimateValues;
  result: EstimateResult;
}

export function PriceCalculator({ zones }: { zones: Zone[] }) {
  const form = useForm<EstimateFormValues, unknown, EstimateValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      originZoneId: zones[0]?.id ?? "",
      destinationZoneId: zones[1]?.id ?? zones[0]?.id ?? "",
      weightKg: undefined,
      serviceType: "STANDARD",
    },
  });
  const [origin, destination, service] = useWatch({ control: form.control, name: ["originZoneId", "destinationZoneId", "serviceType"] });

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

  const zoneOptions = zones.map((zone) => ({ value: zone.id, label: zone.name }));
  const data = quote.data;

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
            <SelectField control={form.control} name="originZoneId" label="From" options={zoneOptions} placeholder="Choose a zone" description={zoneAreas(origin)} />
            <SelectField control={form.control} name="destinationZoneId" label="To" options={zoneOptions} placeholder="Choose a zone" description={zoneAreas(destination)} />
          </div>

          <NumberField control={form.control} name="weightKg" label="Weight" suffix="kg" step="0.01" min={0} placeholder="e.g. 2.5" className="sm:max-w-56" />

          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service</FormLabel>
                <FormControl>
                  <SegmentedControl options={SERVICE_OPTIONS} value={field.value} onValueChange={field.onChange} label="Service" ref={field.ref} fullWidth className="sm:w-auto" />
                </FormControl>
                <FormDescription>{SERVICE_HINTS[service]}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
        ) : data && !data.result.ok && data.result.kind === "unavailable" ? (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-warning-soft text-warning">
              <Info className="size-6" aria-hidden="true" />
            </span>
            <p className="text-xl font-bold">Not available on this route</p>
            <p className="text-muted-foreground">{data.result.message}.</p>
            <p className="text-sm text-muted-foreground">Same-day delivery runs inside one zone, and each service has a weight limit. Try another service or route.</p>
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
  const extraKg = Number(e.chargeableExtraKg);
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-muted-foreground">
        {serviceLabel(e.serviceType)}, {formatWeight(e.weightKg)}, {origin} to {destination}
      </p>
      <p className="pt-2 text-[3.5rem] leading-none font-extrabold tracking-tight text-brand tabular">{formatMoney(e.total)}</p>
      <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted-foreground">Base fee (first {formatWeight(e.baseWeightKg)})</dt>
          <dd className="font-semibold tabular">{formatMoney(e.baseFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted-foreground">
            Extra weight ({extraKg} kg × {formatMoney(e.perKgFee)})
          </dt>
          <dd className="font-semibold tabular">{formatMoney(e.weightCharge)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-extrabold tabular">{formatMoney(e.total)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">Extra weight is charged per started kilogram.</p>
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
