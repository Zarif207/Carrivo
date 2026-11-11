"use client";

// Client: the application form (React Hook Form + Zod), submitted through the BFF.
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField, SelectField, TextareaField } from "@/components/shared/form-fields";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { applicationErrorMessage, useApplyAsCourier } from "@/lib/queries/courier-applications";
import { VEHICLE_NAMES, WORK_AVAILABILITY_NAMES } from "@/lib/status";
import { US_PHONE_PLACEHOLDER, formatUsPhoneInput } from "@/lib/us";
import { APPLICATION_LIMITS, APPLY_FORM_DEFAULTS, applyFormSchema, toApplyBody, type ApplyFormValues } from "@/lib/validation/courier-application";
import { zoneOptions } from "@/lib/zones";
import { VEHICLE_TYPES, WORK_AVAILABILITIES, type Zone } from "@/types";

/** Radix Select can't hold "", so "no preference" has its own value. */
const NO_ZONE = "none";

const AVAILABILITY_HINTS: Record<(typeof WORK_AVAILABILITIES)[number], string> = {
  WEEKDAYS: "Monday to Friday.",
  WEEKENDS: "Saturdays and Sundays.",
  FULL_TIME: "Any day of the week.",
};

const FIELDS = ["phone", "preferredZoneId", "vehicleType", "vehiclePlate", "availability", "experience", "about"] as const;

interface ApplicationFormProps {
  zones: Pick<Zone, "id" | "name">[];
  /** The account's phone, to start from. */
  defaultPhone: string | null;
  /** Set after a rejection: the button reads "Apply again". */
  again?: boolean;
}

export function ApplicationForm({ zones, defaultPhone, again = false }: ApplicationFormProps) {
  const apply = useApplyAsCourier();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    defaultValues: { ...APPLY_FORM_DEFAULTS, phone: formatUsPhoneInput(defaultPhone ?? "") },
    mode: "onTouched",
  });
  const pending = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apply.mutateAsync(toApplyBody(applyFormSchema.parse(values)));
      toast.success("Application submitted", { description: "An admin reviews it soon. We'll notify you when they decide." });
    } catch (error) {
      if (ApiError.isApiError(error)) {
        const fields = error.fieldErrors();
        let focused = false;
        for (const name of FIELDS) {
          if (!fields[name]) continue;
          form.setError(name, { message: fields[name] });
          if (!focused) form.setFocus(name);
          focused = true;
        }
      }
      // 409 (already pending, or the wait after a rejection): the page refetches and changes state too.
      const message = applicationErrorMessage(error);
      setFormError(message);
      toast.error("Couldn't submit your application", { description: message });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6" aria-describedby={formError ? "apply-form-error" : undefined}>
        {formError ? (
          <p id="apply-form-error" role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {formError}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder={US_PHONE_PLACEHOLDER}
                    maxLength={14}
                    {...field}
                    onChange={(event) => field.onChange(formatUsPhoneInput(event.target.value))}
                    disabled={pending}
                    className="font-id"
                  />
                </FormControl>
                <FormDescription>A US number we can call about your application.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredZoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Preferred zone <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <Select value={field.value || NO_ZONE} onValueChange={(v) => field.onChange(v === NO_ZONE ? "" : v)} disabled={pending}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur} ref={field.ref}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_ZONE}>No preference</SelectItem>
                    {zoneOptions(zones).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The metro area you&rsquo;d like to deliver in.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <SelectField
            control={form.control}
            name="vehicleType"
            label="Vehicle"
            placeholder="Choose your vehicle"
            options={VEHICLE_TYPES.map((v) => ({ value: v, label: VEHICLE_NAMES[v] }))}
            disabled={pending}
          />

          <FormField
            control={form.control}
            name="vehiclePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Number plate <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="NY KDR-5512"
                    maxLength={APPLICATION_LIMITS.plateMax}
                    disabled={pending}
                    className="font-id"
                  />
                </FormControl>
                <FormDescription>Leave empty for a bicycle.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="availability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>When can you work?</FormLabel>
              <FormControl>
                <SegmentedControl
                  label="When can you work?"
                  options={WORK_AVAILABILITIES.map((v) => ({ value: v, label: WORK_AVAILABILITY_NAMES[v] }))}
                  // Nothing chosen yet: no segment is checked.
                  value={(field.value ?? "") as (typeof WORK_AVAILABILITIES)[number]}
                  onValueChange={field.onChange}
                  ref={field.ref}
                  fullWidth
                  className="sm:w-auto"
                />
              </FormControl>
              <FormDescription>{field.value ? AVAILABILITY_HINTS[field.value] : "Pick the days that suit you best."}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <TextareaField
          control={form.control}
          name="experience"
          label="Delivery experience"
          optional
          rows={3}
          maxLength={APPLICATION_LIMITS.experience}
          placeholder="For example: two years of food delivery around Midtown."
          description={`Up to ${APPLICATION_LIMITS.experience} characters.`}
          disabled={pending}
        />
        <TextareaField
          control={form.control}
          name="about"
          label="Anything else we should know"
          optional
          rows={4}
          maxLength={APPLICATION_LIMITS.about}
          placeholder="Languages you speak, areas you know well, when you could start."
          description={`Up to ${APPLICATION_LIMITS.about} characters. Please don't include licence, Social Security or other ID numbers.`}
          disabled={pending}
        />

        <CheckboxField
          control={form.control}
          name="consent"
          label="These details are true, and Carrivo may contact me about this application."
          description="An admin reads every application. If it's approved, your account becomes a courier account and you'll sign in again."
          disabled={pending}
          className="rounded-lg bg-secondary p-4"
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">We never ask for licence, Social Security or other ID numbers here.</p>
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {again ? "Apply again" : "Submit application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
