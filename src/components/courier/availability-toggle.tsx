"use client";

// Client: optimistic on/off switch for PATCH /couriers/me/availability.
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { CourierProfile } from "@/types";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const id = useId();
  const [available, setAvailable] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const change = async (next: boolean) => {
    setAvailable(next); // optimistic
    setSaving(true);
    try {
      const { data } = await apiFetch<CourierProfile>(endpoints.couriers.myAvailability, { method: "PATCH", body: { isAvailable: next } });
      setAvailable(data.isAvailable);
      toast.success(data.isAvailable ? "You're available for new tasks" : "You're paused", {
        description: data.isAvailable ? undefined : "You keep your current tasks but get no new ones.",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setAvailable(!next); // rollback
      toast.error(ApiError.isApiError(error) ? error.message : "Couldn't change your availability. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-6 rounded-lg p-4 ring-1 ring-border">
      <div className="space-y-1">
        <label htmlFor={id} className="font-semibold">
          {available ? "Available for new tasks" : "Paused"}
        </label>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {available ? "Admins can assign you new pickups." : "You keep your current tasks, but nobody can assign you new ones."}
        </p>
      </div>
      <Switch id={id} checked={available} onCheckedChange={(next) => void change(next)} disabled={saving} aria-describedby={`${id}-hint`} />
    </div>
  );
}
