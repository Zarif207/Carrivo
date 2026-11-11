"use client";

// Client: the customer dashboard's courier card; its wording follows the live application status.
import { ArrowRight, Bike, CircleX, Hourglass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COURIER_APPLICATION_PATH } from "@/config/nav";
import { formatDate } from "@/lib/format";
import { useMyCourierApplications } from "@/lib/queries/courier-applications";
import { cn } from "@/lib/utils";

const COPY = {
  apply: { icon: Bike, tone: "bg-brand/15 text-brand-text", title: "Deliver with Carrivo", action: "Become a courier" },
  pending: { icon: Hourglass, tone: "bg-tone-amber-bg text-tone-amber-fg", title: "Your courier application is under review", action: "View application" },
  rejected: { icon: CircleX, tone: "bg-tone-red-bg text-tone-red-fg", title: "Your courier application wasn't approved", action: "See why" },
} as const;

/** Fixed height in every state (and while loading), so the dashboard doesn't shift. */
export function BecomeCourierCard() {
  const { data, isPending, isError } = useMyCourierApplications();
  if (isError) return null; // the dashboard works without it
  const latest = data?.latest;
  const state = latest?.status === "PENDING" ? "pending" : latest?.status === "REJECTED" ? "rejected" : "apply";
  const copy = COPY[state];
  const Icon = copy.icon;
  const text =
    state === "pending"
      ? `Sent ${formatDate(latest?.createdAt)}. We'll notify you when an admin decides.`
      : state === "rejected"
        ? data?.canApply
          ? "You can apply again now."
          : data?.canReapplyAt
            ? `You can apply again on ${formatDate(data.canReapplyAt)}.`
            : "Read the reason on your application."
        : "Pick up and deliver parcels in your city on the days that suit you. Apply in about two minutes.";

  return (
    <section aria-labelledby="courier-card-heading" className="flex min-h-36 flex-col gap-4 rounded-xl bg-card p-6 shadow-card sm:flex-row sm:items-center">
      {isPending ? (
        <div className="flex w-full items-center gap-4" aria-hidden="true">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      ) : (
        <>
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", copy.tone)}>
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id="courier-card-heading" className="text-lg font-bold tracking-tight">
              {copy.title}
            </h2>
            <p className="text-muted-foreground">{text}</p>
          </div>
          <Button asChild variant={state === "apply" ? "default" : "outline"} className="self-start sm:self-auto">
            <Link href={COURIER_APPLICATION_PATH}>
              {copy.action} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </>
      )}
    </section>
  );
}
