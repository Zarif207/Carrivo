"use client";

// Client: 3-step wizard with a draft that survives a refresh (sessionStorage), per-step validation,
// and API errors mapped back to the step and field they belong to.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";
import { FIELD_STEP, contactStepSchema, parcelStepSchema, type ContactStep } from "@/lib/validation/shipment";
import { useShipmentDraft, type WizardStep } from "@/stores/shipment-draft";
import type { CreateShipmentInput, Hub, ShipmentDetail, Zone } from "@/types";
import { ContactStepForm } from "./contact-step";
import { ParcelStepForm } from "./parcel-step";
import { ReviewStep } from "./review-step";

const STEPS: { step: WizardStep; title: string; hint: string }[] = [
  { step: 1, title: "Sender and receiver", hint: "Who sends it and who gets it" },
  { step: 2, title: "Parcel and service", hint: "Route, weight and live price" },
  { step: 3, title: "Review and book", hint: "Check everything once more" },
];

interface ServerErrors {
  step: 1 | 2;
  fields: Record<string, string>;
  /** Changes on every failed attempt, so the step re-applies errors even if they're the same. */
  attempt: number;
}

interface NewShipmentWizardProps {
  zones: Zone[];
  hubs: Hub[];
  /** Sender details from the profile, used when the draft has none. */
  senderDefaults: Partial<ContactStep>;
}

export function NewShipmentWizard({ zones, hubs, senderDefaults }: NewShipmentWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const step = useShipmentDraft((s) => s.step);
  const contact = useShipmentDraft((s) => s.contact);
  const parcel = useShipmentDraft((s) => s.parcel);
  const setStep = useShipmentDraft((s) => s.setStep);
  const [serverErrors, setServerErrors] = useState<ServerErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const booked = useRef(false);

  // Clear the draft once we've left the page after a successful booking (no flash of an empty form).
  useEffect(
    () => () => {
      if (booked.current) useShipmentDraft.getState().reset();
    },
    [],
  );

  useEffect(() => {
    void Promise.resolve(useShipmentDraft.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  // Move focus to the step heading when the step changes (not on first load).
  useEffect(() => {
    if (!hydrated) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, hydrated]);

  // Re-validate the draft before showing a step that depends on earlier ones (e.g. stale draft).
  const contactOk = contactStepSchema.safeParse(contact);
  const parcelOk = parcelStepSchema.safeParse(parcel);
  useEffect(() => {
    if (!hydrated) return;
    if (step >= 2 && !contactOk.success) setStep(1);
    else if (step === 3 && !parcelOk.success) setStep(2);
  }, [hydrated, step, contactOk.success, parcelOk.success, setStep]);

  const create = useMutation({
    mutationFn: (body: CreateShipmentInput) => apiFetch<ShipmentDetail>(endpoints.shipments.create, { method: "POST", body }),
    onSuccess: ({ data }) => {
      toast.success("Shipment booked", { description: `${data.trackingId}. Pay to schedule the pickup.` });
      booked.current = true;
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }); // "shipment created" notification
      router.push(`/dashboard/shipments/${data.id}`);
    },
    onError: (error) => {
      if (!ApiError.isApiError(error)) {
        setFormError("Something went wrong. Try again.");
        return;
      }
      const fields = error.fieldErrors();
      const owned = Object.keys(fields).filter((name) => name in FIELD_STEP);
      if (owned.length) {
        const target = Math.min(...owned.map((name) => FIELD_STEP[name])) as 1 | 2;
        setServerErrors((prev) => ({ step: target, fields, attempt: (prev?.attempt ?? 0) + 1 }));
        setStep(target);
        toast.error(error.message);
        return;
      }
      setFormError(error.status === 429 ? "Too many requests. Wait a minute and try again." : error.message);
      toast.error(error.message);
    },
  });

  const confirm = () => {
    if (!contactOk.success || !parcelOk.success) return;
    setFormError(null);
    const c = contactOk.data;
    const p = parcelOk.data;
    create.mutate({
      senderName: c.senderName,
      senderPhone: c.senderPhone,
      pickupAddress: c.pickupAddress,
      receiverName: c.receiverName,
      receiverPhone: c.receiverPhone,
      ...(c.receiverEmail ? { receiverEmail: c.receiverEmail } : {}),
      deliveryAddress: c.deliveryAddress,
      originZoneId: p.originZoneId,
      originHubId: p.originHubId,
      destinationZoneId: p.destinationZoneId,
      destinationHubId: p.destinationHubId,
      weightKg: p.weightKg,
      serviceType: p.serviceType,
      ...(p.description ? { description: p.description } : {}),
      ...(p.declaredValue !== undefined ? { declaredValue: p.declaredValue } : {}),
      isFragile: p.isFragile,
    });
  };

  if (!hydrated) return <WizardSkeleton />;

  const current = STEPS[step - 1];
  const errorsFor = (s: 1 | 2) => (serverErrors?.step === s ? serverErrors.fields : undefined);

  return (
    <div className="space-y-8">
      <ol className="grid grid-cols-3 gap-2" aria-label="Steps">
        {STEPS.map((s) => {
          const done = s.step < step;
          const active = s.step === step;
          return (
            <li key={s.step} aria-current={active ? "step" : undefined} className="space-y-2">
              <span className={cn("block h-1.5 rounded-full", done || active ? "bg-brand" : "bg-border")} aria-hidden="true" />
              <span className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    done ? "bg-brand text-brand-foreground" : active ? "bg-ink text-ink-foreground dark:bg-foreground dark:text-background" : "bg-secondary text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-3.5" /> : s.step}
                </span>
                <span className={cn("hidden font-semibold sm:inline", !active && "text-muted-foreground")}>{s.title}</span>
                <span className="sr-only">
                  Step {s.step}: {s.title}
                  {done ? " (done)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight outline-none">
          {current.title}
        </h2>
        <p className="text-muted-foreground">
          Step {step} of 3. {current.hint}.
        </p>
      </div>

      {step === 1 ? (
        <ContactStepForm key={`contact-${serverErrors?.attempt ?? 0}`} defaults={senderDefaults} serverErrors={errorsFor(1)} />
      ) : step === 2 ? (
        <ParcelStepForm key={`parcel-${serverErrors?.attempt ?? 0}`} zones={zones} hubs={hubs} serverErrors={errorsFor(2)} />
      ) : contactOk.success && parcelOk.success ? (
        <ReviewStep contact={contactOk.data} parcel={parcelOk.data} zones={zones} hubs={hubs} pending={create.isPending || create.isSuccess} formError={formError} onConfirm={confirm} />
      ) : null}
    </div>
  );
}

export function WizardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading the booking form">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
