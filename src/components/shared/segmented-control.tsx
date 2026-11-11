"use client";

// Client: selection state and arrow-key navigation (radio group pattern).
import { useImperativeHandle, useRef, type KeyboardEvent, type Ref } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Shown but not selectable (aria-disabled, so it stays discoverable); explain why with `describedBy`. */
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Accessible name of the group, e.g. "Time range". */
  label: string;
  size?: "sm" | "md";
  /** Stretch to the container and share the width equally (forms on small screens). */
  fullWidth?: boolean;
  className?: string;
  /** focus() moves focus to the selected segment (React Hook Form's setFocus / error focus use it). */
  ref?: Ref<{ focus: () => void }>;
  /** Id(s) of text that describes the group, e.g. why an option is disabled. */
  describedBy?: string;
}

/** Pill-shaped single choice. Arrow keys move and select, like native radios. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  label,
  size = "md",
  fullWidth = false,
  className,
  ref,
  describedBy,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useImperativeHandle(ref, () => ({
    focus: () => refs.current[Math.max(0, options.findIndex((o) => o.value === value))]?.focus(),
  }), [options, value]);

  /** The next enabled option from `start` in direction `step` (wrapping), or -1. */
  const nextEnabled = (start: number, step: number): number => {
    for (let i = 0, at = start; i < options.length; i += 1, at = (at + step + options.length) % options.length) {
      if (!options[at]?.disabled) return at;
    }
    return -1;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    const target =
      event.key === "Home"
        ? nextEnabled(0, 1)
        : event.key === "End"
          ? nextEnabled(options.length - 1, -1)
          : step
            ? nextEnabled((index + step + options.length) % options.length, step)
            : -1;
    if (target < 0) return;
    event.preventDefault();
    onValueChange(options[target].value);
    refs.current[target]?.focus();
  };

  // Radio-group pattern: the checked option is the tab stop; with none checked, the first enabled one is.
  const tabStop = options.some((o) => o.value === value) ? -1 : nextEnabled(0, 1);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-describedby={describedBy}
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-card ring-1 ring-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={option.disabled || undefined}
            tabIndex={selected || index === tabStop ? 0 : -1}
            onClick={() => {
              if (!option.disabled) onValueChange(option.value);
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "rounded-full font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              fullWidth ? "min-w-0 flex-1" : "shrink-0",
              size === "sm" ? "h-8 text-xs" : "h-9 text-sm",
              fullWidth ? "px-2" : size === "sm" ? "px-3" : "px-4",
              selected
                ? "bg-brand text-brand-foreground shadow-card"
                : option.disabled
                  ? "cursor-not-allowed text-muted-foreground/70 line-through decoration-1"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
