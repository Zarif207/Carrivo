"use client";

// Client: create / edit a zone (POST /zones, PATCH /zones/:id).
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SwitchField, TextareaField, TextField } from "@/components/shared/form-fields";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { zoneSchema, type ZoneValues } from "@/lib/validation/settings";
import type { Zone } from "@/types";
import { FormDialog, applyApiError } from "@/components/shared/form-dialog";

const FIELDS = ["name", "code", "description", "isActive"] as const;

export function ZoneDialog({ zone, trigger }: { zone?: Zone; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const defaults: ZoneValues = { name: zone?.name ?? "", code: zone?.code ?? "", description: zone?.description ?? "", isActive: zone?.isActive ?? true };
  const form = useForm<ZoneValues>({ resolver: zodResolver(zoneSchema), defaultValues: defaults });

  const onOpenChange = (next: boolean) => {
    if (next) {
      form.reset(defaults);
      setFormError(null);
    }
    setOpen(next);
  };

  const onSubmit = form.handleSubmit(async (raw) => {
    setFormError(null);
    const v = zoneSchema.parse(raw);
    const body = { name: v.name, code: v.code, description: v.description || null, isActive: v.isActive };
    try {
      await apiFetch<Zone>(zone ? endpoints.zones.detail(zone.id) : endpoints.zones.create, { method: zone ? "PATCH" : "POST", body });
      toast.success(zone ? "Zone saved" : "Zone created", { description: `${v.name} (${v.code})` });
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setFormError(applyApiError(form, error, FIELDS, "zone"));
    }
  });

  return (
    <FormDialog
      form={form}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={zone ? `Edit ${zone.name}` : "New zone"}
      description="Zones group hubs and set where couriers work. Pricing rules can target a route between two zones."
      submitLabel={zone ? "Save zone" : "Create zone"}
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Name" maxLength={100} />
        <TextField control={form.control} name="code" label="Code" maxLength={20} description="Stored in capitals." />
      </div>
      <TextareaField control={form.control} name="description" label="Description" optional maxLength={500} rows={2} />
      <SwitchField control={form.control} name="isActive" label="Active" description="Inactive zones can't be picked for new shipments." />
    </FormDialog>
  );
}
