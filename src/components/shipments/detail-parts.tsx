import { Camera } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/* Server-safe building blocks shared by the customer and courier shipment pages. */

export function DetailCard({ title, children, action, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4 rounded-xl bg-card p-6 shadow-card", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export type DetailRow = [label: string, value: ReactNode];

export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="font-medium break-words sm:text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tap-to-call phone number (mono, per the type rules). */
export function PhoneLink({ phone, className }: { phone: string; className?: string }) {
  return (
    <a href={`tel:${phone.replace(/[\s-]/g, "")}`} className={cn("rounded font-id underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50", className)}>
      {phone}
    </a>
  );
}

/** The stored proof-of-delivery photo (Cloudinary, via next/image). */
export function ProofImage({ url, uploadedAt, trackingId, priority = false }: { url: string; uploadedAt: string | null; trackingId: string; priority?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-surface">
        <Image
          src={url}
          alt={`Photo taken by the courier when ${trackingId} was handed over`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
      {uploadedAt ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="size-4" aria-hidden="true" /> Uploaded {formatDateTime(uploadedAt)}
        </p>
      ) : null}
    </div>
  );
}
