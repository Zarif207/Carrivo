import type { CourierApplicationStatus } from "@/types";

/*
 * The admin queue's tabs (?status=). PENDING is the default (what needs a decision); "all" also
 * includes withdrawn applications. Plain module: used by the page (server) and the tabs (client).
 */
export const APPLICATION_TABS = ["PENDING", "APPROVED", "REJECTED", "all"] as const;
export type ApplicationTab = (typeof APPLICATION_TABS)[number];

export const APPLICATION_TAB_LABELS: Record<ApplicationTab, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  all: "All",
};

export const DEFAULT_APPLICATION_TAB: ApplicationTab = "PENDING";

/** ?status= → tab (anything unknown is the default tab). */
export function parseApplicationTab(raw: string | undefined): ApplicationTab {
  return (APPLICATION_TABS as readonly string[]).includes(raw ?? "") ? (raw as ApplicationTab) : DEFAULT_APPLICATION_TAB;
}

/** Tab → the API's `status` filter (undefined for "all"). */
export const statusForTab = (tab: ApplicationTab): CourierApplicationStatus | undefined => (tab === "all" ? undefined : tab);
