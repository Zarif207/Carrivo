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
import { UsAddressFields } from "@/components/shared/us-address-fields";
import { FormDialog, applyApiError } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { BUSINESS_TIME_ZONE_NAME } from "@/lib/format";
import { zonedDayFrom } from "@/lib/timezone";
import { US_PHONE_PLACEHOLDER, formatUsAddress, parseUsAddress } from "@/lib/us";
import { PICKUP_MAX_DAYS_AHEAD, pickupSchema, toBusinessIso, type PickupValues } from "@/lib/validation/pickup";
import type { ShipmentDetail } from "@/types";

const FIELDS = ["date", "start", "end", "contactName", "contactPhone", "notes"] as const;
/** API names that differ from the form: the window fields, and the address (checked as one line). */
const API_FIELD = { windowStart: "start", windowEnd: "end", pickupAddress: "pickupAddress.street" } as const;

/** YYYY-MM-DD for the business-time-zone day `offset` days from today (called from event handlers only). */
function businessDay(offset: number): string {
  return zonedDayFrom(new Date(), offset);
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
      setLimits({ min: businessDay(0), max: businessDay(PICKUP_MAX_DAYS_AHEAD - 1) });
      form.reset({
        date: businessDay(1),
        start: "10:00",
        end: "14:00",
        pickupAddress: parseUsAddress(shipment.pickupAddress),
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
      windowStart: toBusinessIso(v.date, v.start),
      windowEnd: toBusinessIso(v.date, v.end),
      // Only send what differs from the shipment's own details (the API defaults to those).
      ...(formatUsAddress(v.pickupAddress) !== shipment.pickupAddress ? { pickupAddress: formatUsAddress(v.pickupAddress) } : {}),
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
      setFormError(applyApiError(form, error, FIELDS, "pickup", API_FIELD));
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
      description={`Choose when a courier can collect ${shipment.trackingId}. Times are ${BUSINESS_TIME_ZONE_NAME}. Once booked, the window can't be changed.`}
      submitLabel="Schedule pickup"
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField control={form.control} name="date" label="Day" type="date" min={limits.min || undefined} max={limits.max || undefined} />
        <TextField control={form.control} name="start" label="From" type="time" />
        <TextField control={form.control} name="end" label="Until" type="time" description="Up to 12 hours." />
      </div>
      <UsAddressFields control={form.control} name="pickupAddress" legend="Pickup address" autofillSection="pickup" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={form.control} name="contactName" label="Contact name" autoComplete="name" maxLength={100} />
        <TextField control={form.control} name="contactPhone" label="Contact phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={US_PHONE_PLACEHOLDER} />
      </div>
      <TextareaField control={form.control} name="notes" label="Notes for the courier" optional rows={2} maxLength={500} placeholder="e.g. Ring the bell twice, gate code 4521" />
    </FormDialog>
  );
}

