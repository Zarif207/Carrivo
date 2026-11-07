"use client";

// Client: reads/writes the `range` URL param (or local state when controlled).
import { useUrlState } from "@/hooks/use-url-state";
import { TIME_RANGES, isTimeRange, type TimeRange } from "@/lib/time-range";
import { SegmentedControl } from "./segmented-control";

interface TimeRangeSwitcherProps {
  /** Controlled mode. Omit both to sync with the URL (`?range=`), so the view is bookmarkable. */
  value?: TimeRange;
  onValueChange?: (value: TimeRange) => void;
  /** URL key in uncontrolled mode. */
  param?: string;
  defaultValue?: TimeRange;
  size?: "sm" | "md";
  className?: string;
}

/** Today / This week / This month / This year. Convert with `timeRangeToDates()` for API filters. */
export function TimeRangeSwitcher({ value, onValueChange, param = "range", defaultValue = "month", size, className }: TimeRangeSwitcherProps) {
  const { get, set } = useUrlState();
  const fromUrl = get(param);
  const current = value ?? (isTimeRange(fromUrl) ? fromUrl : defaultValue);

  const change = (next: TimeRange) => {
    if (onValueChange) onValueChange(next);
    else set({ [param]: next === defaultValue ? null : next });
  };

  return <SegmentedControl options={TIME_RANGES} value={current} onValueChange={change} label="Time range" size={size} className={className} />;
}
