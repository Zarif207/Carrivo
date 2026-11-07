import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  /** One short line under the value, e.g. "3 waiting for pickup". */
  hint?: ReactNode;
  /** "feature" marks the one key number per page: the value turns orange (large text, ≥ 3:1). */
  variant?: "default" | "feature";
  /** "compact" for dense spots such as previews and narrow grids. */
  size?: "default" | "compact";
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, variant = "default", size = "default", className }: StatCardProps) {
  const feature = variant === "feature";
  const compact = size === "compact";
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card text-card-foreground shadow-card",
        compact ? "gap-2 p-4" : "min-h-40 p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-full",
              compact ? "size-8 [&_svg]:size-4" : "size-10",
              feature ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {/* Label → number → hint pinned to the bottom, so numbers line up across a row of cards. */}
      <p className={cn("leading-none font-extrabold tracking-tight tabular", compact ? "text-[1.75rem]" : "text-[2.25rem]", feature && "text-brand")}>
        {value}
      </p>
      {hint ? <p className="mt-auto text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-40 flex-col gap-3 rounded-xl bg-card p-6 shadow-card", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="mt-auto h-4 w-32" />
    </div>
  );
}
