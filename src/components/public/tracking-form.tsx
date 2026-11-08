"use client";

// Client: validates the id and navigates to /track/[id].
import { ArrowRight, Loader2, PackageSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeTrackingId } from "@/lib/tracking-id";
import type { TrackingValues } from "@/lib/validation/public";

/**
 * React Hook Form + the Zod schema, but Zod and the resolver load on the first validation instead of
 * with the page: this form sits in the home page hero, where every early kilobyte delays the paint.
 */
const trackingResolver: Resolver<TrackingValues> = async (values, context, options) => {
  const [{ zodResolver }, { trackingSchema }] = await Promise.all([import("@hookform/resolvers/zod"), import("@/lib/validation/public")]);
  return zodResolver(trackingSchema)(values, context, options);
};

interface TrackingFormProps {
  defaultValue?: string;
  /** "card": white elevated card (hero, /track). "plain": just the field and button. */
  variant?: "card" | "plain";
  /** Shown under the field, e.g. an example id. */
  hint?: React.ReactNode;
  autoFocus?: boolean;
  className?: string;
}

export function TrackingForm({ defaultValue = "", variant = "card", hint, autoFocus = false, className }: TrackingFormProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackingValues>({ resolver: trackingResolver, defaultValues: { trackingId: defaultValue } });

  const onSubmit = handleSubmit(({ trackingId }) => {
    startTransition(() => router.push(`/track/${encodeURIComponent(normalizeTrackingId(trackingId))}`));
  });

  const error = errors.trackingId?.message;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      role="search"
      aria-label="Track a parcel"
      className={cn(variant === "card" && "rounded-xl bg-card p-5 shadow-raised sm:p-6", className)}
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-bold">
        Track a parcel
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <PackageSearch className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id={inputId}
            {...register("trackingId")}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            maxLength={24}
            placeholder="CRV-261101-SEED05"
            aria-invalid={error ? true : undefined}
            aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
            className={cn(
              "h-12 w-full rounded-full border border-input bg-card pr-4 pl-12 font-id text-base uppercase outline-none placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-danger aria-invalid:ring-danger/20",
            )}
          />
        </div>
        <Button type="submit" size="lg" disabled={pending} className="sm:w-auto">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Track
          {pending ? null : <ArrowRight aria-hidden="true" />}
        </Button>
      </div>
      <div aria-live="polite">
        {error ? (
          <p id={errorId} className="mt-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="mt-2 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </form>
  );
}
