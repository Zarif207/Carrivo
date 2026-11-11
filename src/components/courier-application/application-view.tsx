"use client";

// Client: the applicant's live application (TanStack Query) and the actions on it.
import { ArrowRight, CalendarClock, CircleCheckBig, CircleX, Hourglass, LogOut, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadError } from "@/components/shared/load-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ROLE_HOME } from "@/config/nav";
import { ApiError } from "@/lib/api/errors";
import { applicationView, pastApplications, type ApplicationView } from "@/lib/courier-application";
import { formatDate, formatDateTime } from "@/lib/format";
import { applicationErrorMessage, useCancelCourierApplication, useMyCourierApplications } from "@/lib/queries/courier-applications";
import { cn } from "@/lib/utils";
import type { CourierApplication, Role, Zone } from "@/types";
import { ApplicationDetails } from "./application-details";
import { ApplicationForm } from "./application-form";
import { ApplicationSkeleton } from "./application-skeleton";

interface ApplicationViewProps {
  role: Extract<Role, "CUSTOMER" | "COURIER">;
  zones: Pick<Zone, "id" | "name">[];
  defaultPhone: string | null;
}

function Card({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("space-y-5 rounded-xl bg-card p-6 shadow-card sm:p-8", className)}>
      {children}
    </section>
  );
}

function StateHeading({ id, icon: Icon, tone, title, children }: { id: string; icon: typeof Hourglass; tone: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", tone)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-1">
        <h2 id={id} className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  );
}

/** The admin's words, set apart so they read as a quote (they're shown to the applicant as-is). */
function ReviewNote({ application }: { application: CourierApplication }) {
  if (!application.reviewNote) return null;
  return (
    <figure className="rounded-lg bg-secondary px-4 py-3">
      <figcaption className="text-sm font-semibold">Reason from the Carrivo team</figcaption>
      <blockquote className="mt-1 whitespace-pre-line break-words">{application.reviewNote}</blockquote>
    </figure>
  );
}

function CancelButton({ application }: { application: CourierApplication }) {
  const cancel = useCancelCourierApplication();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <XCircle aria-hidden="true" /> Cancel application
        </Button>
      }
      tone="destructive"
      title="Cancel your application?"
      description="It's withdrawn straight away and an admin won't review it. You can apply again whenever you like."
      confirmLabel="Cancel application"
      cancelLabel="Keep it"
      onConfirm={async () => {
        try {
          await cancel.mutateAsync(application.id);
          toast.success("Application cancelled", { description: "You can apply again whenever you like." });
        } catch (error) {
          toast.error("Couldn't cancel the application", { description: applicationErrorMessage(error) });
          throw error; // keeps the dialog open
        }
      }}
    />
  );
}

/** Signs out, then lands on /login with a note; signing in again opens the courier dashboard. */
function SignInAgainButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      disabled={pending}
      aria-busy={pending}
      onClick={async () => {
        setPending(true);
        // Clears the cookies (best effort); /login works either way. A full navigation drops client state.
        await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
        window.location.replace(`/login?reason=role-changed&next=${encodeURIComponent(ROLE_HOME.COURIER)}`);
      }}
    >
      <LogOut aria-hidden="true" /> Sign out and sign in again
    </Button>
  );
}

function History({ items }: { items: CourierApplication[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="history-heading" className="space-y-3">
      <h2 id="history-heading" className="text-lg font-bold tracking-tight">
        Earlier applications
      </h2>
      <ol className="divide-y divide-border rounded-xl bg-card shadow-card">
        {items.map((a) => (
          <li key={a.id} className="space-y-2 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Submitted {formatDate(a.createdAt)}</p>
              <StatusBadge kind="courier-application" status={a.status} size="sm" />
            </div>
            {a.reviewedAt ? <p className="text-sm text-muted-foreground">Decided {formatDateTime(a.reviewedAt)}</p> : null}
            {a.reviewNote ? <p className="text-sm break-words whitespace-pre-line">&ldquo;{a.reviewNote}&rdquo;</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function CurrentState({ view, zones, defaultPhone, onCheck, checking }: { view: ApplicationView; zones: ApplicationViewProps["zones"]; defaultPhone: string | null; onCheck: () => void; checking: boolean }) {
  switch (view.kind) {
    case "apply":
      return (
        <Card labelledBy="state-heading">
          <StateHeading id="state-heading" icon={ShieldCheck} tone="bg-brand/15 text-brand-text" title={view.previous ? "Apply again" : "Tell us about yourself"}>
            It takes about two minutes. An admin reviews every application.
          </StateHeading>
          <ApplicationForm zones={zones} defaultPhone={defaultPhone} again={Boolean(view.previous)} />
        </Card>
      );
    case "pending":
      return (
        <Card labelledBy="state-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StateHeading id="state-heading" icon={Hourglass} tone="bg-tone-amber-bg text-tone-amber-fg" title="Your application is under review">
              Submitted {formatDateTime(view.application.createdAt)}. We&rsquo;ll notify you when an admin decides.
            </StateHeading>
            <StatusBadge kind="courier-application" status="PENDING" />
          </div>
          <p className="rounded-lg bg-info-soft px-4 py-3 text-sm font-medium text-info">
            If it&rsquo;s approved, you&rsquo;re signed out everywhere and sign in again as a courier.
          </p>
          <ApplicationDetails application={view.application} />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={onCheck} disabled={checking} aria-busy={checking}>
              <RefreshCw className={cn(checking && "animate-spin")} aria-hidden="true" /> Check status
            </Button>
            <CancelButton application={view.application} />
          </div>
        </Card>
      );
    case "approved":
      return (
        <Card labelledBy="state-heading">
          <StateHeading id="state-heading" icon={CircleCheckBig} tone="bg-tone-green-bg text-tone-green-fg" title="You're a Carrivo courier">
            Your application was approved{view.application.reviewedAt ? ` on ${formatDate(view.application.reviewedAt)}` : ""}. Sign in again to open your courier dashboard.
          </StateHeading>
          <SignInAgainButton />
        </Card>
      );
    case "cooldown":
      return (
        <Card labelledBy="state-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StateHeading id="state-heading" icon={CircleX} tone="bg-tone-red-bg text-tone-red-fg" title="Your application wasn't approved">
              Decided {view.application.reviewedAt ? formatDateTime(view.application.reviewedAt) : "recently"}.
            </StateHeading>
            <StatusBadge kind="courier-application" status="REJECTED" />
          </div>
          <ReviewNote application={view.application} />
          <p className="flex items-start gap-2 rounded-lg bg-secondary px-4 py-3 font-medium">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>
              You can apply again on <strong>{formatDate(view.reapplyAt)}</strong>.
            </span>
          </p>
        </Card>
      );
    case "reapply":
      return (
        <div className="space-y-6">
          <Card labelledBy="rejected-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <StateHeading id="rejected-heading" icon={CircleX} tone="bg-tone-red-bg text-tone-red-fg" title="Your last application wasn't approved">
                You can apply again now.
              </StateHeading>
              <StatusBadge kind="courier-application" status="REJECTED" />
            </div>
            <ReviewNote application={view.application} />
          </Card>
          <Card labelledBy="state-heading">
            <StateHeading id="state-heading" icon={ShieldCheck} tone="bg-brand/15 text-brand-text" title="Apply again">
              Address the reason above, then send a new application.
            </StateHeading>
            <ApplicationForm zones={zones} defaultPhone={defaultPhone} again />
          </Card>
        </div>
      );
    case "courier":
      return (
        <Card labelledBy="state-heading">
          <StateHeading id="state-heading" icon={CircleCheckBig} tone="bg-tone-green-bg text-tone-green-fg" title="You're already a Carrivo courier">
            Courier applications are for customer accounts. Your tasks are waiting on your dashboard.
          </StateHeading>
          <Button asChild>
            <Link href={ROLE_HOME.COURIER}>
              Go to my tasks <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          {view.approved ? (
            <details className="group rounded-lg bg-secondary px-4 py-3">
              <summary className="cursor-pointer font-semibold">Your approved application</summary>
              <div className="pt-4">
                <ApplicationDetails application={view.approved} />
              </div>
            </details>
          ) : null}
        </Card>
      );
    case "blocked":
      return (
        <Card labelledBy="state-heading">
          <StateHeading id="state-heading" icon={CircleX} tone="bg-tone-amber-bg text-tone-amber-fg" title="You can't apply right now">
            {view.reason}
          </StateHeading>
        </Card>
      );
    case "staff":
      return null;
  }
}

export function CourierApplicationView({ role, zones, defaultPhone }: ApplicationViewProps) {
  const query = useMyCourierApplications();

  if (query.isPending) return <ApplicationSkeleton />;
  if (query.isError) {
    const error = query.error;
    return <LoadError what="Your application" message={ApiError.isApiError(error) ? applicationErrorMessage(error) : undefined} />;
  }

  const mine = query.data;
  // `now` only flips an elapsed wait to the form; the API's canReapplyAt decides.
  const view = applicationView(role, mine, new Date());
  const checking = query.isFetching;

  return (
    <div className="space-y-8">
      <CurrentState
        view={view}
        zones={zones}
        defaultPhone={defaultPhone}
        checking={checking}
        onCheck={async () => {
          const result = await query.refetch();
          if (result.data?.latest?.status === "PENDING") toast.info("Still under review", { description: "We'll notify you as soon as an admin decides." });
        }}
      />
      <History items={pastApplications(mine, view)} />
    </div>
  );
}
