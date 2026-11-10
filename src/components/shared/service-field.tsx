"use client";

// Client: the service picker for forms with origin/destination zones. It reads both zones from the
// surrounding form (React Hook Form context) to keep Same day to one zone.
import { Info } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SAME_DAY_REASON, SAME_DAY_SWITCHED, SERVICE_HINTS, SERVICE_OPTIONS, sameDayAllowed } from "@/lib/pricing/services";
import type { ServiceType } from "@/types";

/** The fields this component reads and writes; the host form has more. */
interface ServiceFormShape {
  originZoneId?: string;
  destinationZoneId?: string;
  serviceType?: ServiceType;
}

/**
 * Same day only between one zone and itself. While the zones differ the option is aria-disabled
 * with a visible reason, and if it was selected it switches to Express with an inline note.
 * The API still decides: a refused quote shows a specific message (lib/pricing/services.ts).
 */
export function ServiceField({ className }: { className?: string }) {
  const form = useFormContext<ServiceFormShape>();
  const [origin, destination, value] = useWatch({ control: form.control, name: ["originZoneId", "destinationZoneId", "serviceType"] });
  const allowed = sameDayAllowed(origin, destination);
  const [switched, setSwitched] = useState(false);
  const reasonId = useId();
  const noteId = useId();

  // React to zone changes (not on every render): switch away from Same day once it stops being valid.
  useEffect(() => {
    // A restored draft can start invalid: fix it quietly.
    const initial = form.getValues();
    if (initial.serviceType === "SAME_DAY" && !sameDayAllowed(initial.originZoneId, initial.destinationZoneId)) {
      form.setValue("serviceType", "EXPRESS");
    }
    const subscription = form.watch((values, { name }) => {
      if (name !== "originZoneId" && name !== "destinationZoneId") return;
      if (sameDayAllowed(values.originZoneId, values.destinationZoneId)) {
        setSwitched(false);
      } else if (values.serviceType === "SAME_DAY") {
        form.setValue("serviceType", "EXPRESS", { shouldDirty: true, shouldValidate: true });
        setSwitched(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const options = SERVICE_OPTIONS.map((option) => ({ ...option, disabled: option.value === "SAME_DAY" && !allowed }));
  const describedBy = [!allowed ? reasonId : null, switched ? noteId : null].filter(Boolean).join(" ") || undefined;

  return (
    <FormField
      control={form.control}
      name="serviceType"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>Service</FormLabel>
          <FormControl>
            <SegmentedControl
              options={options}
              value={field.value ?? "STANDARD"}
              onValueChange={(next) => {
                setSwitched(false);
                field.onChange(next);
              }}
              label="Service"
              ref={field.ref}
              describedBy={describedBy}
              fullWidth
              className="sm:w-auto"
            />
          </FormControl>
          <FormDescription>{SERVICE_HINTS[value ?? "STANDARD"]}</FormDescription>
          {!allowed ? (
            <p id={reasonId} className="text-sm text-muted-foreground">
              {SAME_DAY_REASON}
            </p>
          ) : null}
          {switched ? (
            <p id={noteId} role="status" className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-sm font-medium text-info">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {SAME_DAY_SWITCHED}
            </p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
