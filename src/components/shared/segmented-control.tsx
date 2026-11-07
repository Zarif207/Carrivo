"use client";

// Client: selection state and arrow-key navigation (radio group pattern).
import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
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
}

/** Pill-shaped single choice. Arrow keys move and select, like native radios. */
export function SegmentedControl<T extends string>({ options, value, onValueChange, label, size = "md", fullWidth = false, className }: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    const target = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : step ? (index + step + options.length) % options.length : -1;
    if (target < 0) return;
    event.preventDefault();
    onValueChange(options[target].value);
    refs.current[target]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
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
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "rounded-full font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              fullWidth ? "min-w-0 flex-1" : "shrink-0",
              size === "sm" ? "h-8 text-xs" : "h-9 text-sm",
              fullWidth ? "px-2" : size === "sm" ? "px-3" : "px-4",
              selected ? "bg-brand text-brand-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
