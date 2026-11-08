"use client";

// Client: the four US address inputs (street, city, state, ZIP) bound to one React Hook Form object.
// Forms keep the parts; they send formatUsAddress(parts), the one line the API stores.
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { SelectField, TextField, type SelectOption } from "@/components/shared/form-fields";
import { US_STATES } from "@/lib/us";
import { cn } from "@/lib/utils";

const STATE_OPTIONS: SelectOption[] = US_STATES.map(([code, name]) => ({ value: code, label: `${name} (${code})` }));

interface UsAddressFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** Path of an object field shaped like UsAddressParts, e.g. "pickupAddress". */
  name: FieldPath<T>;
  /** Group label read by screen readers and shown as a heading, e.g. "Pickup address". */
  legend: string;
  optional?: boolean;
  description?: string;
  /** Browser autofill section, so two addresses on one form don't overwrite each other (e.g. "pickup"). */
  autofillSection?: string;
  className?: string;
}

export function UsAddressFields<T extends FieldValues>({ control, name, legend, optional, description, autofillSection, className }: UsAddressFieldsProps<T>) {
  const path = (part: "street" | "city" | "state" | "zip") => `${name}.${part}` as FieldPath<T>;
  const auto = (token: string) => (autofillSection ? `section-${autofillSection} ${token}` : token);

  return (
    <fieldset className={cn("space-y-4", className)}>
      <legend className="mb-1 text-sm font-semibold">
        {legend}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">(optional)</span> : null}
      </legend>
      {description ? <p className="-mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <TextField control={control} name={path("street")} label="Street address" autoComplete={auto("street-address")} maxLength={200} placeholder="350 5th Ave, Apt 4B" />
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_0.8fr]">
        <TextField control={control} name={path("city")} label="City" autoComplete={auto("address-level2")} maxLength={80} placeholder="New York" />
        <SelectField control={control} name={path("state")} label="State" options={STATE_OPTIONS} placeholder="Choose a state" />
        <TextField control={control} name={path("zip")} label="ZIP code" autoComplete={auto("postal-code")} inputMode="numeric" maxLength={10} placeholder="10118" />
      </div>
    </fieldset>
  );
}
