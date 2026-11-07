"use client";

// Client: All / Unread switch kept in the URL (?unread=true).
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useUrlState } from "@/hooks/use-url-state";

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
] as const;

export function NotificationFilter() {
  const { get, set } = useUrlState();
  const value = get("unread") === "true" ? "unread" : "all";
  return <SegmentedControl options={OPTIONS} value={value} onValueChange={(next) => set({ unread: next === "unread" ? "true" : null })} label="Show" />;
}
