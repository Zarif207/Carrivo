import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TONE_CLASSES, type Tone } from "@/lib/status";
import { cn } from "@/lib/utils";

interface PaymentResultProps {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description: ReactNode;
  /** Spin the icon (still checking). */
  busy?: boolean;
  /** Receipt rows. */
  details?: { label: string; value: ReactNode }[];
  /** Extra content between the details and the actions (e.g. a progress bar). */
  children?: ReactNode;
  actions?: ReactNode;
}

/** The outcome card on /payment/success and /payment/cancel. Server-safe (no hooks). */
export function PaymentResult({ icon: Icon, tone, title, description, busy = false, details, children, actions }: PaymentResultProps) {
  return (
    <section aria-labelledby="payment-result-title" className="mx-auto w-full max-w-xl rounded-xl bg-card p-6 shadow-card sm:p-8">
      <div className={cn("flex size-14 items-center justify-center rounded-full", TONE_CLASSES[tone])}>
        <Icon className={cn("size-7", busy && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
      </div>
      <h1 id="payment-result-title" tabIndex={-1} className="mt-5 font-display text-2xl font-extrabold tracking-tight outline-none sm:text-3xl">
        {title}
      </h1>
      <div className="mt-2 text-muted-foreground">{description}</div>

      {details?.length ? (
        <dl className="mt-6 divide-y divide-border rounded-lg ring-1 ring-border">
          {details.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children}

      {actions ? <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </section>
  );
}

export function PaymentResultSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl bg-card p-6 shadow-card sm:p-8" aria-busy="true">
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-10 w-40 rounded-full" />
    </div>
  );
}
