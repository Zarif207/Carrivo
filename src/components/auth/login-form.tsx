"use client";

// Client: validated sign-in form; posts to /api/auth/login, which sets the httpOnly cookies.
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";

export function LoginForm({ next }: { next?: string | null }) {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values, next);
    } catch (error) {
      if (!ApiError.isApiError(error)) return setFormError("Something went wrong. Try again.");
      if (error.status === 401) return setFormError("Email or password is incorrect.");
      const fields = error.fieldErrors();
      let shown = false;
      for (const [name, message] of Object.entries(fields)) {
        if (name === "email" || name === "password") {
          form.setError(name, { message });
          shown = true;
        }
      }
      if (!shown) setFormError(error.message);
    }
  });

  const pending = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby={formError ? "login-error" : undefined}>
        <TextField control={form.control} name="email" label="Email" type="email" autoComplete="email" inputMode="email" />
        <TextField control={form.control} name="password" label="Password" type="password" autoComplete="current-password" />
        {formError ? (
          <p id="login-error" role="alert" className="rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </Form>
  );
}
