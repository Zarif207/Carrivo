"use client";

// Client: step 2 form (route, parcel, service) with a live price estimate.
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumberField, SelectField, SwitchField, TextareaField } from "@/components/shared/form-fields";
import { ServiceField } from "@/components/shared/service-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiError } from "@/lib/api/errors";
import { describePriceProblem } from "@/lib/pricing/services";
import { toEstimateInput, useEstimate } from "@/lib/queries/pricing";
import { hubOptions, hubsInZone, sortZones, zoneOptions } from "@/lib/zones";
import { parcelStepSchema, type ParcelStep, type ParcelStepInput } from "@/lib/validation/shipment";
import { useShipmentDraft } from "@/stores/shipment-draft";
import type { Hub, Zone } from "@/types";
import { EstimateCard } from "./estimate-card";
import { useServerErrors } from "./use-server-errors";

const FIELDS = ["originZoneId", "originHubId", "destinationZoneId", "destinationHubId", "weightLb", "serviceType", "description", "declaredValue", "isFragile"] as const;

interface ParcelStepFormProps {
  zones: Zone[];
  hubs: Hub[];
  serverErrors?: Record<string, string>;
}

export function ParcelStepForm({ zones: unsorted, hubs, serverErrors }: ParcelStepFormProps) {
  const zones = useMemo(() => sortZones(unsorted), [unsorted]);
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
      weightLb: undefined,
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

  const [originZoneId, originHubId, destinationZoneId, destinationHubId, weightLb, serviceType] = useWatch({
    control: form.control,
    name: ["originZoneId", "originHubId", "destinationZoneId", "destinationHubId", "weightLb", "serviceType"],
  });

  const originHubs = useMemo(() => hubsInZone(hubs, originZoneId), [hubs, originZoneId]);
  const destinationHubs = useMemo(() => hubsInZone(hubs, destinationZoneId), [hubs, destinationZoneId]);

  // Keep each hub inside its zone: a hub from another zone is replaced by the zone's main hub (first
  // in the list), which the customer can change. Only writes when the value changes, so it can't loop.
  useEffect(() => {
    if (originHubs.some((h) => h.id === originHubId)) return;
    const wanted = originHubs[0]?.id ?? "";
    if (wanted !== originHubId) form.setValue("originHubId", wanted);
  }, [originHubs, originHubId, form]);
  useEffect(() => {
    if (destinationHubs.some((h) => h.id === destinationHubId)) return;
    const wanted = destinationHubs[0]?.id ?? "";
    if (wanted !== destinationHubId) form.setValue("destinationHubId", wanted);
  }, [destinationHubs, destinationHubId, form]);

  const debouncedWeight = useDebounce(weightLb, 400);
  const estimateInput = toEstimateInput({ originZoneId, destinationZoneId, weightLb: debouncedWeight, serviceType });
  const estimate = useEstimate(estimateInput);
  const zoneName = (id: string | undefined) => zones.find((z) => z.id === id)?.name;
  const priceContext = { serviceType, originZoneId, destinationZoneId, originName: zoneName(originZoneId), destinationName: zoneName(destinationZoneId) };

  const next = form.handleSubmit((values) => {
    if (estimate.isError && ApiError.isApiError(estimate.error) && estimate.error.status === 422) {
      const problem = describePriceProblem(estimate.error.message, priceContext);
      form.setError(problem.field, { message: problem.message });
      form.setFocus(problem.field);
      return;
    }
    saveParcel(values);
    setStep(3);
  });

  const back = () => {
    saveParcel(form.getValues()); // keep what was typed, valid or not
    setStep(1);
  };

  const zoneChoices = zoneOptions(zones);
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
            <SelectField control={form.control} name="originZoneId" label="Pickup zone" options={zoneChoices} description={zoneArea(originZoneId)} />
            <SelectField control={form.control} name="originHubId" label="Pickup hub" options={hubOptions(originHubs)} placeholder={originHubs.length ? "Choose a hub" : "No hub in this zone"} />
            <SelectField control={form.control} name="destinationZoneId" label="Delivery zone" options={zoneChoices} description={zoneArea(destinationZoneId)} />
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
            <NumberField control={form.control} name="weightLb" label="Weight" suffix="lb" step="0.01" min={0} placeholder="e.g. 5.5" />
            <ServiceField />
          </div>
          <EstimateCard query={estimate} ready={estimateInput !== null} context={priceContext} />
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
