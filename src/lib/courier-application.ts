import { ApiError } from "@/lib/api/errors";
import type { CourierApplication, MyCourierApplications, Role } from "@/types";

/*
 * What /courier-application shows, decided in one pure function (unit-tested). The API's own
 * answer (canApply, canReapplyAt) is the authority; `now` only flips a finished wait to the form
 * without a refetch.
 */

export type ApplicationView =
  /** Admins and viewers: applications are reviewed in the admin area. */
  | { kind: "staff" }
  /** Already a courier (the approved application, when there is one). */
  | { kind: "courier"; approved: CourierApplication | null }
  /** Never applied, or the last one was withdrawn. */
  | { kind: "apply"; previous: CourierApplication | null }
  | { kind: "pending"; application: CourierApplication }
  /** Approved, but this session still carries the old role: sign in again. */
  | { kind: "approved"; application: CourierApplication }
  /** Rejected and the wait before applying again is still running. */
  | { kind: "cooldown"; application: CourierApplication; reapplyAt: string }
  /** Rejected, wait over: the reason, then the form again. */
  | { kind: "reapply"; application: CourierApplication }
  /** The API says no for a reason this page doesn't model (shown as-is). */
  | { kind: "blocked"; reason: string };

export function applicationView(role: Role, mine: MyCourierApplications, now: Date): ApplicationView {
  if (role === "ADMIN" || role === "ADMIN_VIEWER") return { kind: "staff" };
  if (role === "COURIER") return { kind: "courier", approved: mine.history.find((a) => a.status === "APPROVED") ?? null };

  const latest = mine.latest;
  if (!latest) return mine.canApply || !mine.blockedReason ? { kind: "apply", previous: null } : { kind: "blocked", reason: mine.blockedReason };
  switch (latest.status) {
    case "PENDING":
      return { kind: "pending", application: latest };
    case "APPROVED":
      return { kind: "approved", application: latest };
    case "REJECTED":
      if (mine.canReapplyAt && new Date(mine.canReapplyAt).getTime() > now.getTime()) {
        return { kind: "cooldown", application: latest, reapplyAt: mine.canReapplyAt };
      }
      return { kind: "reapply", application: latest };
    case "CANCELLED":
      return mine.canApply || !mine.blockedReason ? { kind: "apply", previous: latest } : { kind: "blocked", reason: mine.blockedReason };
  }
}

/** Past applications to list under the current state (everything except the one shown on top). */
export function pastApplications(mine: MyCourierApplications, view: ApplicationView): CourierApplication[] {
  const shown =
    view.kind === "pending" || view.kind === "approved" || view.kind === "cooldown" || view.kind === "reapply"
      ? view.application.id
      : view.kind === "courier"
        ? view.approved?.id
        : undefined;
  return mine.history.filter((a) => a.id !== shown);
}

/**
 * While an application is pending, an approval can end this session at any moment (the API revokes
 * every session of the new courier). The UI remembers that, so the 401 that follows is explained as
 * a role change rather than an expired session (lib/auth/session-end.ts).
 */
export const expectsRoleChange = (mine: MyCourierApplications | undefined): boolean => mine?.latest?.status === "PENDING";

/** User-facing words for a failed apply, cancel or decision (429 and network errors get their own). */
export function applicationErrorMessage(error: unknown): string {
  if (!ApiError.isApiError(error)) return "Something went wrong. Try again.";
  if (error.isRateLimited) return "Too many tries in a short time. Wait a few minutes, then try again.";
  if (error.isNetworkError) return "The server didn't answer. Nothing was changed; try again.";
  return error.message;
}
