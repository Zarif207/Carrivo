"use client";

// Client: editable profile (PATCH /users/me through the BFF).
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/shared/form-fields";
import { UsAddressFields } from "@/components/shared/us-address-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { US_PHONE_PLACEHOLDER, formatUsAddress, parseUsAddress } from "@/lib/us";
import { isEmptyAddress } from "@/lib/validation/us";
import { profileSchema, type ProfileValues } from "@/lib/validation/profile";
import { toSessionUser, useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

const FIELDS = new Set(["name", "phone", "address", "image"]);

// A hidden address starts blank, so a stored line that doesn't parse can't block the save (it's never sent).
const toValues = (p: Pick<UserProfile, "name" | "phone" | "address" | "image">, withAddress = true): ProfileValues => ({
  name: p.name,
  phone: p.phone ?? "",
  address: parseUsAddress(withAddress ? p.address : null),
  image: p.image ?? "",
});

interface ProfileFormProps {
  profile: UserProfile;
  /** The address only fills in the pickup address, so staff profiles leave it out (and never send it). */
  withAddress?: boolean;
}

export function ProfileForm({ profile, withAddress = true }: ProfileFormProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toValues(profile, withAddress),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { data } = await apiFetch<UserProfile>(endpoints.users.me, {
        method: "PATCH",
        body: {
          name: values.name,
          phone: values.phone || null,
          ...(withAddress ? { address: isEmptyAddress(values.address) ? null : formatUsAddress(values.address) } : {}),
          image: values.image || null,
        },
      });
      setUser(toSessionUser(data));
      form.reset(toValues(data, withAddress));
      toast.success("Profile saved");
      router.refresh(); // the shell's name and avatar come from the server
    } catch (error) {
      if (!ApiError.isApiError(error)) return void toast.error("Couldn't save your profile. Try again.");
      const fields = Object.entries(error.fieldErrors()).filter(([name]) => FIELDS.has(name));
      // The API checks the address as one line: show its message on the street field.
      const target = (name: string) => (name === "address" ? "address.street" : name) as keyof ProfileValues;
      for (const [name, message] of fields) form.setError(target(name), { message });
      if (fields.length) form.setFocus(target(fields[0][0]));
      toast.error(error.message);
    }
  });

  const { isSubmitting, isDirty } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Full name" autoComplete="name" />
          <TextField control={form.control} name="phone" label="Phone" optional type="tel" inputMode="tel" autoComplete="tel" placeholder={US_PHONE_PLACEHOLDER} />
        </div>
        {withAddress ? (
          <UsAddressFields control={form.control} name="address" legend="Address" optional description="Used as the pickup address when you book." />
        ) : null}
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
