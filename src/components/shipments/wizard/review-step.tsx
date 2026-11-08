"use client";

// Client: step 3, summary of the draft and the create request.
import { ArrowLeft, Loader2, PackageCheck, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatWeight } from "@/lib/format";
import { toEstimateInput, useEstimate } from "@/lib/queries/pricing";
import { SERVICE_NAMES } from "@/lib/status";
import type { ContactStep, ParcelStep } from "@/lib/validation/shipment";
import { useShipmentDraft, type WizardStep } from "@/stores/shipment-draft";
import type { Hub, Zone } from "@/types";
import { EstimateCard } from "./estimate-card";

function Section({ title, step, children }: { title: string; step: WizardStep; children: ReactNode }) {
  const setStep = useShipmentDraft((s) => s.setStep);
  return (
    <section className="space-y-3 rounded-xl bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(step)}>
          <Pencil aria-hidden="true" /> Edit <span className="sr-only">{title.toLowerCase()}</span>
        </Button>
      </div>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words sm:text-right">{value}</dd>
    </div>
  );
}

interface ReviewStepProps {
  contact: ContactStep;
  parcel: ParcelStep;
  zones: Zone[];
  hubs: Hub[];
  pending: boolean;
  formError: string | null;
  onConfirm: () => void;
}

export function ReviewStep({ contact, parcel, zones, hubs, pending, formError, onConfirm }: ReviewStepProps) {
  const setStep = useShipmentDraft((s) => s.setStep);
  const zone = (id: string) => zones.find((z) => z.id === id)?.name ?? "Unknown zone";
  const hub = (id: string) => hubs.find((h) => h.id === id)?.name ?? "Unknown hub";
  const estimate = useEstimate(toEstimateInput(parcel));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Sender and receiver" step={1}>
          <Row label="Sender" value={`${contact.senderName}, ${contact.senderPhone}`} />
          <Row label="Pickup address" value={contact.pickupAddress} />
          <Row label="Receiver" value={`${contact.receiverName}, ${contact.receiverPhone}`} />
          {contact.receiverEmail ? <Row label="Receiver email" value={contact.receiverEmail} /> : null}
          <Row label="Delivery address" value={contact.deliveryAddress} />
        </Section>
        <Section title="Parcel and service" step={2}>
          <Row label="From" value={`${zone(parcel.originZoneId)} (${hub(parcel.originHubId)})`} />
          <Row label="To" value={`${zone(parcel.destinationZoneId)} (${hub(parcel.destinationHubId)})`} />
          <Row label="Weight" value={formatWeight(parcel.weightLb)} />
          <Row label="Service" value={SERVICE_NAMES[parcel.serviceType]} />
          {parcel.description ? <Row label="Contents" value={parcel.description} /> : null}
          {parcel.declaredValue !== undefined ? <Row label="Declared value" value={formatMoney(parcel.declaredValue)} /> : null}
          <Row label="Fragile" value={parcel.isFragile ? "Yes" : "No"} />
        </Section>
      </div>

      <EstimateCard query={estimate} ready />

      <p className="text-sm text-muted-foreground">
        The final price is worked out again when you book, with the same rules. You pay after booking, before pickup.
      </p>

      {formError ? (
        <p role="alert" className="rounded-xl bg-danger-soft p-4 text-sm font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)} disabled={pending}>
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
        <Button type="button" size="lg" onClick={onConfirm} disabled={pending || estimate.isError} aria-busy={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
          {pending ? "Booking…" : "Book shipment"}
        </Button>
      </div>
    </div>
  );
}
