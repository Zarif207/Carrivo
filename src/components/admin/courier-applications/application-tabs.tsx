"use client";

// Client: status tabs with live counts; the choice lives in the URL (?status=), the server re-renders.
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useUrlState } from "@/hooks/use-url-state";
import { APPLICATION_TABS, APPLICATION_TAB_LABELS, DEFAULT_APPLICATION_TAB, type ApplicationTab } from "@/lib/admin/courier-application-tabs";
import { formatCount } from "@/lib/format";

export function ApplicationTabs({ tab, counts }: { tab: ApplicationTab; counts: Record<ApplicationTab, number> }) {
  const { set } = useUrlState();
  return (
    <SegmentedControl
      label="Application status"
      options={APPLICATION_TABS.map((t) => ({ value: t, label: `${APPLICATION_TAB_LABELS[t]} ${formatCount(counts[t])}` }))}
      value={tab}
      onValueChange={(next) => set({ status: next === DEFAULT_APPLICATION_TAB ? null : next, view: null })}
      // Four tabs with counts: share the width on phones (nothing scrolls out of sight), shrink to fit from sm up.
      size="sm"
      fullWidth
      className="sm:inline-flex sm:w-auto"
    />
  );
}
