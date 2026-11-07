"use client";

// Client: one-click sign-in as a seeded demo account (the password stays on the server).
import { Bike, Loader2, Package, ShieldCheck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const DEMOS: { role: Role; label: string; description: string; icon: LucideIcon; tone: string }[] = [
  {
    role: "ADMIN",
    label: "Admin",
    description: "Hubs, couriers, payments and reports",
    icon: ShieldCheck,
    tone: "bg-ink text-ink-foreground dark:bg-foreground dark:text-background",
  },
  {
    role: "COURIER",
    label: "Courier",
    description: "Pickups, deliveries and earnings",
    icon: Bike,
    tone: "bg-tone-blue-bg text-tone-blue-fg",
  },
  {
    role: "CUSTOMER",
    label: "Customer",
    description: "Book, pay for and track shipments",
    icon: Package,
    tone: "bg-brand text-brand-foreground",
  },
];

export function DemoLogin({ next }: { next?: string | null }) {
  const { demoLogin } = useAuth();
  const [pending, setPending] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (role: Role) => {
    setPending(role);
    setError(null);
    try {
      await demoLogin(role, next);
      // Navigation is under way; keep the spinner until the page changes.
    } catch (err) {
      const message = ApiError.isApiError(err) ? err.message : "Demo login didn't work. Try again.";
      setError(message);
      toast.error(message);
      setPending(null);
    }
  };

  return (
    <section aria-labelledby="demo-heading" className="space-y-3">
      <div>
        <h2 id="demo-heading" className="text-base font-bold">
          Quick demo login
        </h2>
        <p className="text-sm text-muted-foreground">Explore Carrivo with a ready-made account. No password needed.</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {DEMOS.map((demo) => {
          const busy = pending === demo.role;
          return (
            <li key={demo.role}>
              <button
                type="button"
                onClick={() => signIn(demo.role)}
                disabled={pending !== null}
                aria-busy={busy}
                className="flex h-full w-full flex-col items-start gap-3 rounded-xl bg-card p-4 text-left shadow-card ring-1 ring-border outline-none transition-[box-shadow,transform] hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 enabled:active:translate-y-px"
              >
                <span className={cn("grid size-10 place-items-center rounded-full", demo.tone)}>
                  {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <demo.icon className="size-5" aria-hidden="true" />}
                </span>
                <span className="space-y-0.5">
                  <span className="block font-bold">Log in as {demo.label}</span>
                  <span className="block text-xs text-muted-foreground">{demo.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
