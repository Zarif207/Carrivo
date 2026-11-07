"use client";

// Client: create / edit a hub (POST /hubs, PATCH /hubs/:id).
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SelectField, SwitchField, TextField } from "@/components/shared/form-fields";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { hubSchema, type HubValues } from "@/lib/validation/settings";
import type { Hub, Zone } from "@/types";
import { FormDialog, applyApiError } from "@/components/shared/form-dialog";

const FIELDS = ["name", "code", "address", "city", "phone", "zoneId", "isActive"] as const;

export function HubDialog({ hub, zones, trigger }: { hub?: Hub; zones: Pick<Zone, "id" | "name" | "isActive">[]; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const defaults: HubValues = {
    name: hub?.name ?? "",
    code: hub?.code ?? "",
    address: hub?.address ?? "",
    city: hub?.city ?? "",
    phone: hub?.phone ?? "",
    zoneId: hub?.zone.id ?? "",
    isActive: hub?.isActive ?? true,
  };
  const form = useForm<HubValues>({ resolver: zodResolver(hubSchema), defaultValues: defaults });
  // Only active zones can take a hub; keep the current one listed when editing.
  const options = zones.filter((z) => z.isActive || z.id === hub?.zone.id).map((z) => ({ value: z.id, label: z.isActive ? z.name : `${z.name} (inactive)` }));

  const onOpenChange = (next: boolean) => {
    if (next) {
      form.reset(defaults);
      setFormError(null);
    }
    setOpen(next);
  };

  const onSubmit = form.handleSubmit(async (raw) => {
    setFormError(null);
    const v = hubSchema.parse(raw);
    const body = { name: v.name, code: v.code, address: v.address, city: v.city, phone: v.phone || null, zoneId: v.zoneId, isActive: v.isActive };
    try {
      await apiFetch<Hub>(hub ? endpoints.hubs.detail(hub.id) : endpoints.hubs.create, { method: hub ? "PATCH" : "POST", body });
      toast.success(hub ? "Hub saved" : "Hub created", { description: `${v.name} (${v.code})` });
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setFormError(applyApiError(form, error, FIELDS, "hub"));
    }
  });

  return (
    <FormDialog
      form={form}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={hub ? `Edit ${hub.name}` : "New hub"}
      description="Hubs are where parcels are sorted. Each belongs to one zone; a hub in use can't change zone."
      submitLabel={hub ? "Save hub" : "Create hub"}
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Name" maxLength={100} />
        <TextField control={form.control} name="code" label="Code" maxLength={30} description="Stored in capitals." />
      </div>
      <SelectField control={form.control} name="zoneId" label="Zone" options={options} placeholder="Choose a zone" />
      <TextField control={form.control} name="address" label="Address" maxLength={300} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={form.control} name="city" label="City" maxLength={100} />
        <TextField control={form.control} name="phone" label="Phone" optional type="tel" inputMode="tel" placeholder="+8802..." />
      </div>
      <SwitchField control={form.control} name="isActive" label="Active" description="Inactive hubs can't be picked for new shipments." />
    </FormDialog>
  );
}
