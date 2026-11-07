"use client";

// Client: validated sign-up form; posts to /api/auth/register (always a customer account).
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { registerFormSchema, type RegisterFormValues } from "@/lib/validation/auth";

const FIELDS = new Set(["name", "email", "phone", "password"]);

export function RegisterForm({ next }: { next?: string | null }) {
  const { register } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async ({ name, email, password, phone }) => {
    setFormError(null);
    try {
      // confirmPassword is checked in the browser only; the API never receives it.
      await register({ name, email, password, phone: phone ? phone : undefined }, next);
    } catch (error) {
      if (!ApiError.isApiError(error)) return setFormError("Something went wrong. Try again.");
      if (error.status === 409) {
        form.setError("email", { message: "An account with this email already exists. Log in instead." });
        return;
      }
      let shown = false;
      for (const [name, message] of Object.entries(error.fieldErrors())) {
        if (FIELDS.has(name)) {
          form.setError(name as keyof RegisterFormValues, { message });
          shown = true;
        }
      }
      if (!shown) setFormError(error.message);
    }
  });

  const pending = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField control={form.control} name="name" label="Full name" autoComplete="name" />
        <TextField control={form.control} name="email" label="Email" type="email" autoComplete="email" inputMode="email" />
        <TextField
          control={form.control}
          name="phone"
          label="Phone"
          optional
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+8801711000000"
          description="Couriers call this number about pickups."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="password" label="Password" type="password" autoComplete="new-password" description="At least 8 characters." />
          <TextField control={form.control} name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" />
        </div>
        {formError ? (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {pending ? "Creating your account…" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
