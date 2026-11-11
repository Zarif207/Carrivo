"use client";

// Client: side sheet for one application (?view=<id>), with Approve / Reject for ADMIN only.
import { Eye } from "lucide-react";
import Link from "next/link";
import { CanMutate } from "@/components/auth/role-gate";
import { ApplicationAnswers, applicationRows } from "@/components/courier-application/application-details";
import { UserAvatar } from "@/components/layout/user-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailRows, PhoneLink } from "@/components/shipments/detail-parts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime } from "@/lib/format";
import type { AdminCourierApplication, Hub, Zone } from "@/types";
import { ApproveDialog, RejectDialog } from "./decision-dialogs";

function Decision({ application }: { application: AdminCourierApplication }) {
  if (application.status !== "PENDING") {
    return (
      <div className="space-y-3">
        <h3 className="font-bold">Decision</h3>
        <DetailRows
          rows={[
            ["Status", <StatusBadge key="s" kind="courier-application" status={application.status} size="sm" />],
            ...(application.reviewedBy ? [["Decided by", application.reviewedBy.name] as [string, string]] : []),
            ...(application.reviewedAt ? [["Decided", formatDateTime(application.reviewedAt)] as [string, string]] : []),
          ]}
        />
        {application.reviewNote ? (
          <figure className="rounded-lg bg-secondary px-4 py-3">
            <figcaption className="text-sm font-semibold">Note to the applicant</figcaption>
            <blockquote className="mt-1 break-words whitespace-pre-line">{application.reviewNote}</blockquote>
          </figure>
        ) : null}
      </div>
    );
  }
  return null;
}

function SheetBody({ application, zones, hubs }: { application: AdminCourierApplication; zones: Pick<Zone, "id" | "name">[]; hubs: Hub[] }) {
  const u = application.user;
  return (
    <>
      <SheetHeader className="space-y-3 text-left">
        <div className="flex items-center gap-4">
          <UserAvatar user={{ name: u.name, image: null }} className="size-14 text-base" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-xl">{u.name}</SheetTitle>
            <SheetDescription className="truncate">{u.email}</SheetDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="courier-application" status={application.status} size="sm" />
          <StatusBadge kind="role" status={u.role} size="sm" />
          {u.status === "INACTIVE" ? <StatusBadge kind="user" status={u.status} size="sm" /> : null}
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        {application.status === "PENDING" ? (
          <CanMutate
            readOnly={
              <p className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm">
                <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> View only: an admin approves or rejects applications.
              </p>
            }
          >
            <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Decide on this application">
              <ApproveDialog application={application} zones={zones} hubs={hubs} />
              <RejectDialog application={application} />
            </div>
          </CanMutate>
        ) : null}

        <section className="space-y-3">
          <h3 className="font-bold">Application</h3>
          <DetailRows rows={applicationRows(application)} />
          <ApplicationAnswers application={application} />
        </section>

        <Decision application={application} />

        <section className="space-y-3">
          <h3 className="font-bold">Account</h3>
          <DetailRows
            rows={[
              ["Account phone", u.phone ? <PhoneLink key="p" phone={u.phone} /> : "Not set"],
              [
                "User",
                <Link key="u" href={`/admin/users?view=${u.id}`} className="rounded font-semibold text-brand-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  Open in Users
                </Link>,
              ],
            ]}
          />
        </section>
      </div>
    </>
  );
}

export function ApplicationSheet({ application, missing, zones, hubs }: { application: AdminCourierApplication | null; missing: boolean; zones: Pick<Zone, "id" | "name">[]; hubs: Hub[] }) {
  const { get, set } = useUrlState();
  const open = Boolean(get("view"));
  const close = () => set({ view: null }, { resetPage: false });
  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {application ? (
          // Keyed on id + status: after a decision the fresh server render remounts it.
          <SheetBody key={`${application.id}:${application.status}`} application={application} zones={zones} hubs={hubs} />
        ) : (
          <SheetHeader>
            <SheetTitle>Application not found</SheetTitle>
            <SheetDescription>{missing ? "It may have been removed, or the link is wrong." : "Pick an application from the list."}</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
