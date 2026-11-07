"use client";

import { useEffect } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

/** Applies API field errors to a step's form once, and focuses the first one. */
export function useServerErrors<T extends FieldValues>(form: UseFormReturn<T>, errors: Record<string, string> | undefined, fields: readonly string[]) {
  useEffect(() => {
    if (!errors) return;
    const entries = Object.entries(errors).filter(([name]) => fields.includes(name));
    for (const [name, message] of entries) form.setError(name as FieldPath<T>, { type: "server", message });
    const first = fields.find((name) => name in errors);
    if (first) {
      // Let the step render before moving focus.
      requestAnimationFrame(() => form.setFocus(first as FieldPath<T>));
    }
  }, [errors, fields, form]);
}
