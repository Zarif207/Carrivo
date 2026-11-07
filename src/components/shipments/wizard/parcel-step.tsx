"use client";

// Client: step 2 form (route, parcel, service) with a live price estimate.
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumberField, SelectField, SwitchField, TextareaField } from "@/components/shared/form-fields";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiError } from "@/lib/api/errors";
import { toEstimateInput, useEstimate } from "@/lib/queries/pricing";
import { parcelStepSchema, type ParcelStep, type ParcelStepInput } from "@/lib/validation/shipment";
import { useShipmentDraft } from "@/stores/shipment-draft";
import type { Hub, ServiceType, Zone } from "@/types";
import { EstimateCard } from "./estimate-card";
import { useServerErrors } from "./use-server-errors";

const FIELDS = ["originZoneId", "originHubId", "destinationZoneId", "destinationHubId", "weightKg", "serviceType", "description", "declaredValue", "isFragile"] as const;

const SERVICE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "SAME_DAY", label: "Same day" },
] as const satisfies readonly { value: ServiceType; label: string }[];

const SERVICE_HINTS: Record<ServiceType, string> = {
  STANDARD: "The everyday option for parcels that aren't urgent.",
  EXPRESS: "Faster and higher priced, for parcels that need to arrive sooner.",
  SAME_DAY: "Picked up and delivered the same day, within one zone only.",
};

interface ParcelStepFormProps {
  zones: Zone[];
  hubs: Hub[];
  serverErrors?: Record<string, string>;
}

export function ParcelStepForm({ zones, hubs, serverErrors }: ParcelStepFormProps) {
  const draft = useShipmentDraft((s) => s.parcel);
  const saveParcel = useShipmentDraft((s) => s.saveParcel);
  const setStep = useShipmentDraft((s) => s.setStep);

  const form = useForm<ParcelStepInput, unknown, ParcelStep>({
    resolver: zodResolver(parcelStepSchema),
    defaultValues: {
      originZoneId: zones[0]?.id ?? "",
      originHubId: "",
      destinationZoneId: zones[1]?.id ?? zones[0]?.id ?? "",
      destinationHubId: "",
      weightKg: undefined,
      serviceType: "STANDARD",
      description: "",
      declaredValue: undefined,
      isFragile: false,
      ...draft,
    },
  });
  useServerErrors(form, serverErrors, FIELDS);

  // Autosave as you type, so a refresh keeps the step exactly as it was.
  const typed = useWatch({ control: form.control });
  useEffect(() => {
    saveParcel(typed as Partial<ParcelStepInput>);
  }, [typed, saveParcel]);

  const [originZoneId, originHubId, destinationZoneId, destinationHubId, weightKg, serviceType] = useWatch({
    control: form.control,
    name: ["originZoneId", "originHubId", "destinationZoneId", "destinationHubId", "weightKg", "serviceType"],
  });

  const originHubs = useMemo(() => hubs.filter((hub) => hub.zone.id === originZoneId && hub.isActive), [hubs, originZoneId]);
  const destinationHubs = useMemo(() => hubs.filter((hub) => hub.zone.id === destinationZoneId && hub.isActive), [hubs, destinationZoneId]);

  // Keep each hub inside its zone: pick the only hub automatically, clear a hub from another zone.
  // Only writes when the value actually changes, so it can't loop.
  useEffect(() => {
    if (originHubs.some((h) => h.id === originHubId)) return;
    const wanted = originHubs.length === 1 ? originHubs[0].id : "";
    if (wanted !== originHubId) form.setValue("originHubId", wanted);
  }, [originHubs, originHubId, form]);
  useEffect(() => {
    if (destinationHubs.some((h) => h.id === destinationHubId)) return;
    const wanted = destinationHubs.length === 1 ? destinationHubs[0].id : "";
    if (wanted !== destinationHubId) form.setValue("destinationHubId", wanted);
  }, [destinationHubs, destinationHubId, form]);

  const debouncedWeight = useDebounce(weightKg, 400);
  const estimateInput = toEstimateInput({ originZoneId, destinationZoneId, weightKg: debouncedWeight, serviceType });
  const estimate = useEstimate(estimateInput);

  const next = form.handleSubmit((values) => {
    if (estimate.isError && ApiError.isApiError(estimate.error) && estimate.error.status === 422) {
      const onWeight = estimate.error.errors.some((e) => e.path.endsWith("weightKg"));
      form.setError(onWeight ? "weightKg" : "serviceType", { message: estimate.error.message });
      form.setFocus(onWeight ? "weightKg" : "serviceType");
      return;
    }
    saveParcel(values);
    setStep(3);
  });

  const back = () => {
    saveParcel(form.getValues()); // keep what was typed, valid or not
    setStep(1);
  };

  const zoneOptions = zones.map((zone) => ({ value: zone.id, label: zone.name }));
  const hubOptions = (list: Hub[]) => list.map((hub) => ({ value: hub.id, label: `${hub.name}, ${hub.city}` }));
  const zoneArea = (id: string | undefined) => zones.find((z) => z.id === id)?.description ?? undefined;

  return (
    <Form {...form}>
      <form onSubmit={next} noValidate className="space-y-8">
        <fieldset className="space-y-5 rounded-xl bg-card p-6 shadow-card">
          <legend className="sr-only">Route</legend>
          <h3 className="text-lg font-bold" aria-hidden="true">
            Route
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField control={form.control} name="originZoneId" label="Pickup zone" options={zoneOptions} description={zoneArea(originZoneId)} />
            <SelectField control={form.control} name="originHubId" label="Pickup hub" options={hubOptions(originHubs)} placeholder={originHubs.length ? "Choose a hub" : "No hub in this zone"} />
            <SelectField control={form.control} name="destinationZoneId" label="Delivery zone" options={zoneOptions} description={zoneArea(destinationZoneId)} />
            <SelectField
              control={form.control}
              name="destinationHubId"
              label="Delivery hub"
              options={hubOptions(destinationHubs)}
              placeholder={destinationHubs.length ? "Choose a hub" : "No hub in this zone"}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-5 rounded-xl bg-card p-6 shadow-card">
          <legend className="sr-only">Parcel and service</legend>
          <h3 className="text-lg font-bold" aria-hidden="true">
            Parcel and service
          </h3>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <NumberField control={form.control} name="weightKg" label="Weight" suffix="kg" step="0.01" min={0} placeholder="e.g. 2.5" />
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <FormControl>
                    <SegmentedControl options={SERVICE_OPTIONS} value={field.value} onValueChange={field.onChange} label="Service" ref={field.ref} fullWidth className="sm:w-auto" />
                  </FormControl>
                  <FormDescription>{SERVICE_HINTS[serviceType ?? "STANDARD"]}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <EstimateCard query={estimate} ready={estimateInput !== null} />
          <TextareaField control={form.control} name="description" label="What's inside" optional rows={2} maxLength={500} />
          <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
            <NumberField control={form.control} name="declaredValue" label="Declared value" optional suffix="USD" step="0.01" min={0} description="What the contents are worth." />
            <SwitchField control={form.control} name="isFragile" label="Fragile" description="The courier handles it with extra care." />
          </div>
        </fieldset>

        <div className="flex flex-wrap justify-between gap-3">
          <Button type="button" variant="outline" size="lg" onClick={back}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
          <Button type="submit" size="lg" disabled={estimate.isFetching}>
            Next: review <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
