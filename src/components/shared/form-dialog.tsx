"use client";

// Client: dialog shell for the forms in dialogs (stays open while saving and after an error).
import { CircleAlert, Loader2 } from "lucide-react";
import type { FormEventHandler, ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ApiError } from "@/lib/api/errors";

interface FormDialogProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  description: string;
  submitLabel: string;
  formError: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

export function FormDialog<T extends FieldValues>({ form, open, onOpenChange, trigger, title, description, submitLabel, formError, onSubmit, children }: FormDialogProps<T>) {
  const pending = form.formState.isSubmitting;
  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {formError ? (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {formError}
              </p>
            ) : null}
            {children}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Puts API field errors on the matching inputs (focusing the first) and returns a form-level message
 * for the rest, e.g. 409 "a zone with this code already exists". Always toasts.
 */
/**
 * Puts the API's field errors on the form and toasts the failure. `aliases` maps an API field to a
 * different form path, e.g. { pickupAddress: "pickupAddress.street" } for the US address group.
 */
export function applyApiError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  fields: readonly Path<T>[],
  what: string,
  aliases: Partial<Record<string, Path<T>>> = {},
): string {
  if (!ApiError.isApiError(error)) {
    toast.error(`Couldn't save the ${what}`, { description: "Try again in a moment." });
    return "Something went wrong. Try again.";
  }
  const byField = error.fieldErrors();
  let focused = false;
  for (const [apiName, message] of Object.entries(byField)) {
    const name = aliases[apiName] ?? (fields as readonly string[]).find((field) => field === apiName);
    if (!name || !message) continue;
    form.setError(name as Path<T>, { message });
    if (!focused) {
      form.setFocus(name as Path<T>);
      focused = true;
    }
  }
  const message = error.isNetworkError ? "The server didn't answer. Nothing was saved; try again." : error.message;
  toast.error(`Couldn't save the ${what}`, { description: message });
  return message;
}
