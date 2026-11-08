"use client";

// Client: create / edit a pricing rule (POST /pricing, PATCH /pricing/:id).
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch, type Control, type DefaultValues } from "react-hook-form";
import { toast } from "sonner";
import { NumberField, SelectField, SwitchField, TextField } from "@/components/shared/form-fields";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { formatMoney } from "@/lib/format";
import { SERVICE_NAMES } from "@/lib/status";
import { pricingSchema, type PricingValues } from "@/lib/validation/settings";
import { SERVICE_TYPES, type PricingRule, type Zone } from "@/types";
import { FormDialog, applyApiError } from "@/components/shared/form-dialog";

const FIELDS = ["name", "serviceType", "originZoneId", "destinationZoneId", "baseFee", "baseWeightLb", "perLbFee", "maxWeightLb", "isActive"] as const;
const NONE = "none";

export function PricingDialog({ rule, zones, trigger }: { rule?: PricingRule; zones: Pick<Zone, "id" | "name" | "isActive">[]; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const defaults: DefaultValues<PricingValues> = {
    name: rule?.name ?? "",
    serviceType: rule?.serviceType ?? "STANDARD",
    originZoneId: rule?.originZone?.id ?? "",
    destinationZoneId: rule?.destinationZone?.id ?? "",
    baseFee: rule ? Number(rule.baseFee) : undefined,
    baseWeightLb: rule ? Number(rule.baseWeightLb) : 1,
    perLbFee: rule ? Number(rule.perLbFee) : undefined,
    maxWeightLb: rule?.maxWeightLb ? Number(rule.maxWeightLb) : undefined,
    isActive: rule?.isActive ?? true,
  };
  const form = useForm<PricingValues>({ resolver: zodResolver(pricingSchema), defaultValues: defaults });
  const zoneOptions = [{ value: NONE, label: "Any zone (default rule)" }, ...zones.filter((z) => z.isActive).map((z) => ({ value: z.id, label: z.name }))];
  const [base, perLb, baseLb] = useWatch({ control: form.control, name: ["baseFee", "perLbFee", "baseWeightLb"] });

  const onOpenChange = (next: boolean) => {
    if (next) {
      form.reset(defaults);
      setFormError(null);
    }
    setOpen(next);
  };

  const onSubmit = form.handleSubmit(async (raw) => {
    setFormError(null);
    const v = pricingSchema.parse(raw);
    const body = {
      name: v.name,
      serviceType: v.serviceType,
      originZoneId: v.originZoneId || null,
      destinationZoneId: v.destinationZoneId || null,
      baseFee: v.baseFee,
      baseWeightLb: v.baseWeightLb,
      perLbFee: v.perLbFee,
      maxWeightLb: v.maxWeightLb ?? null,
      isActive: v.isActive,
    };
    try {
      await apiFetch<PricingRule>(rule ? endpoints.pricing.detail(rule.id) : endpoints.pricing.create, { method: rule ? "PATCH" : "POST", body });
      toast.success(rule ? "Pricing rule saved" : "Pricing rule created", { description: v.name });
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setFormError(applyApiError(form, error, FIELDS, "pricing rule"));
    }
  });

  // The zone selects use a sentinel for "any zone"; the form keeps "" (see pricingSchema).
  const zoneField = (name: "originZoneId" | "destinationZoneId", label: string) => (
    <NoneMappedSelect control={form.control} name={name} label={label} options={zoneOptions} />
  );

  return (
    <FormDialog
      form={form}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={rule ? `Edit ${rule.name}` : "New pricing rule"}
      description="Price = base fee + every started pound over the base weight × fee per pound. A route rule beats the service's default rule."
      submitLabel={rule ? "Save rule" : "Create rule"}
      formError={formError}
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Name" maxLength={100} />
        <SelectField control={form.control} name="serviceType" label="Service" options={SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_NAMES[s] }))} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {zoneField("originZoneId", "From zone")}
        {zoneField("destinationZoneId", "To zone")}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <NumberField control={form.control} name="baseFee" label="Base fee" min={0} step="0.01" suffix="USD" />
        <NumberField control={form.control} name="baseWeightLb" label="Base weight" min={0} step="0.1" suffix="lb" />
        <NumberField control={form.control} name="perLbFee" label="Per extra lb" min={0} step="0.01" suffix="USD" />
      </div>
      <NumberField control={form.control} name="maxWeightLb" label="Weight cap" optional min={0} step="0.1" suffix="lb" description="Heavier parcels get no quote on this rule." />
      {typeof base === "number" && typeof perLb === "number" && typeof baseLb === "number" ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm tabular">
          Example: a {baseLb + 2} lb parcel costs {formatMoney(base + 2 * perLb)}.
        </p>
      ) : null}
      <SwitchField control={form.control} name="isActive" label="Active" description="Only one active rule per service and route." />
    </FormDialog>
  );
}

/** SelectField can't hold "" as a value (Radix), so this maps "" ⇄ "none". */
function NoneMappedSelect({ control, name, label, options }: { control: Control<PricingValues>; name: "originZoneId" | "destinationZoneId"; label: string; options: { value: string; label: string }[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value ? field.value : NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
            <FormControl>
              <SelectTrigger ref={field.ref} className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
