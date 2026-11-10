"use client";

// Client: change password through /api/auth/change-password (Better Auth's raw response is filtered there).
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField, PasswordField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { passwordSchema, type PasswordValues } from "@/lib/validation/profile";

const EMPTY: PasswordValues = { currentPassword: "", newPassword: "", confirmPassword: "", revokeOtherSessions: false };

export function PasswordForm({ email }: { email: string }) {
  const { changePassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: EMPTY });

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword, revokeOtherSessions }) => {
    setFormError(null);
    try {
      await changePassword({ currentPassword, newPassword, revokeOtherSessions });
      form.reset(EMPTY);
      toast.success("Password changed", { description: revokeOtherSessions ? "Your other devices have been signed out." : undefined });
    } catch (error) {
      if (!ApiError.isApiError(error)) return setFormError("Couldn't change your password. Try again.");
      const current = error.fieldErrors().currentPassword;
      if (current) {
        form.setError("currentPassword", { message: current });
        form.setFocus("currentPassword");
        return;
      }
      if (error.status === 429) return setFormError("Too many attempts. Wait 15 minutes and try again.");
      setFormError(error.message);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* Lets password managers file the new password under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <PasswordField control={form.control} name="currentPassword" label="Current password" autoComplete="current-password" />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField control={form.control} name="newPassword" label="New password" autoComplete="new-password" description="At least 8 characters." />
          <PasswordField control={form.control} name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
        </div>
        <CheckboxField control={form.control} name="revokeOtherSessions" label="Sign out my other devices" description="You stay signed in here." />
        {formError ? (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {form.formState.isSubmitting ? "Changing…" : "Change password"}
        </Button>
      </form>
    </Form>
  );
}
