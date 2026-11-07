"use client";

// Client: the pickup-window form (POST /shipments/:id/pickup) in a dialog.
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { TextareaField, TextField } from "@/components/shared/form-fields";
import { FormDialog, applyApiError } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { BUSINESS_TIME_ZONE } from "@/lib/format";
import { PICKUP_MAX_DAYS_AHEAD, pickupSchema, toDhakaIso, type PickupValues } from "@/lib/validation/pickup";
import type { ShipmentDetail } from "@/types";

const FIELDS = ["date", "start", "end", "pickupAddress", "contactName", "contactPhone", "notes"] as const;
/** The API names the window fields windowStart / windowEnd. */
const API_FIELD: Record<string, (typeof FIELDS)[number]> = { windowStart: "start", windowEnd: "end" };

/** YYYY-MM-DD for a Dhaka day `offset` days from now (called from event handlers only). */
function dhakaDay(offset: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + offset * 86_400_000));
}

interface Props {
  shipment: Pick<ShipmentDetail, "id" | "trackingId" | "pickupAddress" | "senderName" | "senderPhone">;
}

export function SchedulePickupDialog({ shipment }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [limits, setLimits] = useState({ min: "", max: "" });
  const [, startTransition] = useTransition();

  // The clock is read when the form validates, so "in the future" is always judged against now.
  const resolver: Resolver<PickupValues> = (values, context, options) => zodResolver(pickupSchema(Date.now()))(values, context, options);
  const form = useForm<PickupValues>({ resolver });

  const onOpenChange = (next: boolean) => {
    if (next) {
      setLimits({ min: dhakaDay(0), max: dhakaDay(PICKUP_MAX_DAYS_AHEAD - 1) });
      form.reset({
        date: dhakaDay(1),
        start: "10:00",
        end: "14:00",
        pickupAddress: shipment.pickupAddress,
        contactName: shipment.senderName,
        contactPhone: shipment.senderPhone,
        notes: "",
      });
      setFormError(null);
    }
    setOpen(next);
  };

  const onSubmit = form.handleSubmit(async (v) => {
    setFormError(null);
    const body = {
      windowStart: toDhakaIso(v.date, v.start),
      windowEnd: toDhakaIso(v.date, v.end),
      // Only send what differs from the shipment's own details (the API defaults to those).
      ...(v.pickupAddress.trim() !== shipment.pickupAddress ? { pickupAddress: v.pickupAddress.trim() } : {}),
      ...(v.contactName.trim() !== shipment.senderName ? { contactName: v.contactName.trim() } : {}),
      ...(v.contactPhone.trim() !== shipment.senderPhone ? { contactPhone: v.contactPhone.trim() } : {}),
      ...(v.notes.trim() ? { notes: v.notes.trim() } : {}),
    };
    try {
      await apiFetch<ShipmentDetail>(endpoints.shipments.pickup(shipment.id), { method: "POST", body });
      toast.success("Pickup scheduled", { description: `${shipment.trackingId}: we'll assign a courier for that window.` });
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      startTransition(() => router.refresh());
    } catch (error) {
      // windowStart / windowEnd errors land on the matching time inputs.
      if (ApiError.isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          if (API_FIELD[field]) form.setError(API_FIELD[field], { message });
        }
      }
      setFormError(applyApiError(form, error, FIELDS, "pickup"));
    }
  });

  return (
    <FormDialog
      form={form}
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <Button>
          <CalendarClock aria-hidden="true" /> Schedule pickup
        </Button>
      }
      title="Schedule a pickup"
      description={`Choose when a courier can collect ${shipment.trackingId}. Times are Dhaka time. Once booked, the window can't be changed.`}
      submitLabel="Schedule pickup"
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField control={form.control} name="date" label="Day" type="date" min={limits.min || undefined} max={limits.max || undefined} />
        <TextField control={form.control} name="start" label="From" type="time" />
        <TextField control={form.control} name="end" label="Until" type="time" description="Up to 12 hours." />
      </div>
      <TextareaField control={form.control} name="pickupAddress" label="Pickup address" rows={2} maxLength={300} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={form.control} name="contactName" label="Contact name" autoComplete="name" maxLength={100} />
        <TextField control={form.control} name="contactPhone" label="Contact phone" type="tel" inputMode="tel" autoComplete="tel" />
      </div>
      <TextareaField control={form.control} name="notes" label="Notes for the courier" optional rows={2} maxLength={500} placeholder="e.g. Ring the bell twice, gate code 4521" />
    </FormDialog>
  );
}

