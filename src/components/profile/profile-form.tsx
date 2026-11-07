"use client";

// Client: editable profile (PATCH /users/me through the BFF).
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextareaField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { profileSchema, type ProfileValues } from "@/lib/validation/profile";
import { toSessionUser, useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

const FIELDS = new Set(["name", "phone", "address", "image"]);

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, phone: profile.phone ?? "", address: profile.address ?? "", image: profile.image ?? "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { data } = await apiFetch<UserProfile>(endpoints.users.me, {
        method: "PATCH",
        body: { name: values.name, phone: values.phone || null, address: values.address || null, image: values.image || null },
      });
      setUser(toSessionUser(data));
      form.reset({ name: data.name, phone: data.phone ?? "", address: data.address ?? "", image: data.image ?? "" });
      toast.success("Profile saved");
      router.refresh(); // the shell's name and avatar come from the server
    } catch (error) {
      if (!ApiError.isApiError(error)) return void toast.error("Couldn't save your profile. Try again.");
      const fields = Object.entries(error.fieldErrors()).filter(([name]) => FIELDS.has(name));
      for (const [name, message] of fields) form.setError(name as keyof ProfileValues, { message });
      if (fields.length) form.setFocus(fields[0][0] as keyof ProfileValues);
      toast.error(error.message);
    }
  });

  const { isSubmitting, isDirty } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Full name" autoComplete="name" />
          <TextField control={form.control} name="phone" label="Phone" optional type="tel" inputMode="tel" autoComplete="tel" placeholder="+8801711000000" />
        </div>
        <TextareaField control={form.control} name="address" label="Address" optional rows={2} maxLength={300} description="Used as the pickup address when you book." />
        <TextField control={form.control} name="image" label="Photo link" optional type="url" inputMode="url" placeholder="https://" description="A link to a square photo. Leave empty to show your initials." />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          <p className="text-sm text-muted-foreground">Email: {profile.email} (can&rsquo;t be changed here)</p>
        </div>
      </form>
    </Form>
  );
}
