"use client";

// Client: React Hook Form field bindings.
import type { ComponentProps, ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: ReactNode;
  /** Adds "(optional)" after the label. */
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <FormLabel>
      {label}
      {optional ? <span className="font-normal text-muted-foreground">(optional)</span> : null}
    </FormLabel>
  );
}

type InputExtras = Pick<ComponentProps<"input">, "type" | "placeholder" | "autoComplete" | "inputMode" | "maxLength" | "min" | "max">;

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  optional,
  disabled,
  className,
  ...input
}: BaseFieldProps<T> & InputExtras) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} optional={optional} />
          <FormControl>
            <Input {...input} {...field} value={field.value ?? ""} disabled={disabled} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Keeps the form value a number (or undefined when empty), as the API expects. */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  optional,
  disabled,
  className,
  step = "any",
  min,
  max,
  suffix,
  placeholder,
}: BaseFieldProps<T> & { step?: string; min?: number; max?: number; suffix?: string; placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} optional={optional} />
          <div className="relative">
            <FormControl>
              <Input
                type="number"
                inputMode="decimal"
                step={step}
                min={min}
                max={max}
                placeholder={placeholder}
                disabled={disabled}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={typeof field.value === "number" && Number.isFinite(field.value) ? field.value : ""}
                onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)}
                className={cn("tabular", suffix && "pr-12")}
              />
            </FormControl>
            {suffix ? (
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
            ) : null}
          </div>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  optional,
  disabled,
  className,
  placeholder,
  maxLength,
  rows = 3,
}: BaseFieldProps<T> & { placeholder?: string; maxLength?: number; rows?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} optional={optional} />
          <FormControl>
            <Textarea {...field} value={field.value ?? ""} placeholder={placeholder} maxLength={maxLength} rows={rows} disabled={disabled} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  optional,
  disabled,
  className,
  options,
  placeholder = "Choose one",
}: BaseFieldProps<T> & { options: SelectOption[]; placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} optional={optional} />
          <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger className="w-full" onBlur={field.onBlur} ref={field.ref}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({ control, name, label, description, disabled, className }: BaseFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex items-center justify-between gap-4 rounded-lg bg-surface p-4 ring-1 ring-border", className)}>
          <div className="space-y-1">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} onBlur={field.onBlur} ref={field.ref} disabled={disabled} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function CheckboxField<T extends FieldValues>({ control, name, label, description, disabled, className }: BaseFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex items-start gap-3", className)}>
          <FormControl>
            <Checkbox
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={disabled}
              className="mt-0.5"
            />
          </FormControl>
          <div className="space-y-1">
            <FormLabel className="font-medium">{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
