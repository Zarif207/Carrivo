"use client";

// Client: Approve and Reject dialogs (React Hook Form + Zod). They stay open on an error and show the
// API's message; a 409 for an application that's no longer pending also refreshes the page.
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormDialog } from "@/components/shared/form-dialog";
import { TextareaField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { applicationErrorMessage } from "@/lib/queries/courier-applications";
import {
  APPLICATION_LIMITS,
  approveFormSchema,
  rejectFormSchema,
  toApproveBody,
  type ApproveFormValues,
  type RejectFormValues,
} from "@/lib/validation/courier-application";
import { hubOptions, hubsInZone, zoneOptions } from "@/lib/zones";
import type { AdminCourierApplication, Hub, Zone } from "@/types";

const NO_HUB = "none";

/** 409 because someone already decided (or the applicant withdrew): the row on screen is stale. */
const isStale = (error: unknown) => ApiError.isApiError(error) && error.isConflict && error.errors.some((e) => e.path === "status");

/** After a decision (or a stale 409): refresh the server-rendered list and the sidebar/dashboard counts. */
function useAfterDecision() {
  const router = useRouter();
  const client = useQueryClient();
  const [, startTransition] = useTransition();
  return () => {
    void client.invalidateQueries({ queryKey: queryKeys.courierApplications.all });
    startTransition(() => router.refresh());
  };
}

export function ApproveDialog({ application, zones, hubs }: { application: AdminCourierApplication; zones: Pick<Zone, "id" | "name">[]; hubs: Hub[] }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const refresh = useAfterDecision();
  const preferred = application.preferredZone?.id ?? "";
  const form = useForm<ApproveFormValues>({ resolver: zodResolver(approveFormSchema), defaultValues: { zoneId: preferred, hubId: "" } });
  const zoneId = useWatch({ control: form.control, name: "zoneId" });

  const zoneHubs = useMemo(() => hubsInZone(hubs, zoneId || undefined), [hubs, zoneId]);
  const zoneName = zones.find((z) => z.id === zoneId)?.name ?? "the zone you choose";
  const first = application.user.name.split(" ")[0] || application.user.name;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch(endpoints.admin.approveCourierApplication(application.id), { method: "PATCH", body: toApproveBody(values) });
      toast.success(`${application.user.name} is now a courier`, { description: "They're signed out everywhere and sign in again as a courier." });
      setOpen(false);
      refresh();
    } catch (error) {
      if (ApiError.isApiError(error)) {
        const fields = error.fieldErrors();
        if (fields.zoneId) form.setError("zoneId", { message: fields.zoneId });
        if (fields.hubId) form.setError("hubId", { message: fields.hubId });
      }
      setFormError(applicationErrorMessage(error));
      if (isStale(error)) refresh();
    }
  });

  return (
    <FormDialog
      form={form}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          form.reset({ zoneId: preferred, hubId: "" });
          setFormError(null);
        }
      }}
      trigger={
        <Button className="w-full sm:w-auto">
          <BadgeCheck aria-hidden="true" /> Approve
        </Button>
      }
      title={`Make ${application.user.name} a courier?`}
      description={`${first}'s account becomes a courier account in ${zoneName}: they can take delivery tasks but can no longer book shipments as a customer. They're signed out on every device and sign in again as a courier.`}
      submitLabel="Approve"
      formError={formError}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="zoneId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zone</FormLabel>
            <Select
              value={field.value}
              onValueChange={(next) => {
                field.onChange(next);
                // A hub belongs to one zone: picking another zone clears it.
                form.setValue("hubId", "");
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full" onBlur={field.onBlur} ref={field.ref}>
                  <SelectValue placeholder="Choose a zone" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {zoneOptions(zones).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{application.preferredZone ? `They asked for ${application.preferredZone.name}.` : "They didn't pick a zone, so choose one."}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="hubId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Hub <span className="font-normal text-muted-foreground">(optional)</span>
            </FormLabel>
            <Select value={field.value || NO_HUB} onValueChange={(v) => field.onChange(v === NO_HUB ? "" : v)} disabled={!zoneId}>
              <FormControl>
                <SelectTrigger className="w-full" onBlur={field.onBlur} ref={field.ref}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NO_HUB}>No hub</SelectItem>
                {hubOptions(zoneHubs).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{zoneId ? (zoneHubs.length ? "Only hubs in the chosen zone." : "This zone has no hubs yet.") : "Choose a zone first."}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}

export function RejectDialog({ application }: { application: AdminCourierApplication }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const refresh = useAfterDecision();
  const form = useForm<RejectFormValues>({ resolver: zodResolver(rejectFormSchema), defaultValues: { note: "" }, mode: "onTouched" });
  const note = useWatch({ control: form.control, name: "note" }) ?? "";

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch(endpoints.admin.rejectCourierApplication(application.id), { method: "PATCH", body: { note: values.note.trim() } });
      toast.success("Application rejected", { description: `${application.user.name} sees your reason and can apply again in 7 days.` });
      setOpen(false);
      refresh();
    } catch (error) {
      const fields = ApiError.isApiError(error) ? error.fieldErrors() : {};
      if (fields.note) form.setError("note", { message: fields.note });
      setFormError(applicationErrorMessage(error));
      if (isStale(error)) refresh();
    }
  });

  return (
    <FormDialog
      form={form}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          form.reset({ note: "" });
          setFormError(null);
        }
      }}
      trigger={
        <Button variant="outline" className="w-full sm:w-auto">
          <CircleX aria-hidden="true" /> Reject
        </Button>
      }
      title={`Reject ${application.user.name}'s application?`}
      description="They'll see your note and can apply again after 7 days. Their account stays a customer account."
      submitLabel="Reject application"
      formError={formError}
      onSubmit={onSubmit}
    >
      <TextareaField
        control={form.control}
        name="note"
        label="Reason for the applicant"
        rows={4}
        maxLength={APPLICATION_LIMITS.noteMax}
        placeholder="For example: we need a vehicle that can carry parcels up to 50 lb."
        description={`${note.trim().length} of ${APPLICATION_LIMITS.noteMax} characters (at least ${APPLICATION_LIMITS.noteMin}). Be kind and specific: it's shown to them as written.`}
      />
    </FormDialog>
  );
}
