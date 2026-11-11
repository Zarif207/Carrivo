import { COURIER_APPLICATION_PATH, ROLE_HOME } from "@/config/nav";
import { loginPath } from "@/lib/auth/redirects";
import { applicationView } from "@/lib/courier-application";
import type { MyCourierApplications, Role } from "@/types";

/*
 * Where every "Become a courier" button in the courier campaign (home section, /drive-with-carrivo,
 * its sticky mobile bar) goes, decided once (unit-tested). The page stays the single application form
 * at COURIER_APPLICATION_PATH; this only picks the words and the door.
 */

export type CourierCtaKind =
  /** No session: log in (or register) first, then come straight back to the form. */
  | "signed-out"
  /** A customer who can apply now (or once their application data couldn't be read). */
  | "apply"
  /** A customer with an application in progress: pending, approved awaiting sign-in, or rejected with the wait running. */
  | "view-application"
  | "courier"
  | "staff";

export interface CourierCta {
  kind: CourierCtaKind;
  href: string;
  label: string;
  /** One short line under the button that says what happens next. */
  note: string;
}

/** The logged-out answer: also the static fallback, so it is what visitors without JavaScript get. */
export const SIGNED_OUT_CTA: CourierCta = {
  kind: "signed-out",
  // Validated by loginPath (same-origin path only); the proxy sends signed-in visitors on by role.
  href: loginPath(COURIER_APPLICATION_PATH),
  label: "Become a courier",
  note: "Log in or create a free customer account first.",
};

export function courierCtaKind(role: Role | null, mine: MyCourierApplications | null, now: Date): CourierCtaKind {
  if (!role) return "signed-out";
  if (role === "COURIER") return "courier";
  if (role === "ADMIN" || role === "ADMIN_VIEWER") return "staff";
  if (!mine) return "apply"; // unreadable: the application page itself shows the real state
  const view = applicationView(role, mine, now).kind;
  return view === "pending" || view === "approved" || view === "cooldown" ? "view-application" : "apply";
}

export function courierCta(role: Role | null, mine: MyCourierApplications | null, now: Date): CourierCta {
  const kind = courierCtaKind(role, mine, now);
  switch (kind) {
    case "signed-out":
      return SIGNED_OUT_CTA;
    case "apply":
      return { kind, href: COURIER_APPLICATION_PATH, label: "Become a courier", note: "About two minutes. An admin reviews every application." };
    case "view-application": {
      const status = mine?.latest?.status;
      const note =
        status === "PENDING"
          ? "Your application is with an admin."
          : status === "APPROVED"
            ? "You're approved. Sign in again as a courier."
            : "See your answer and when you can apply again.";
      return { kind, href: COURIER_APPLICATION_PATH, label: "View my application", note };
    }
    case "courier":
      return { kind, href: ROLE_HOME.COURIER, label: "Go to my dashboard", note: "You're already a Carrivo courier." };
    case "staff":
      return { kind, href: ROLE_HOME.ADMIN, label: "Go to admin", note: "Admin accounts can't apply to be couriers." };
  }
}
