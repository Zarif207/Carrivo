import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** Say what to do next, not how it feels. */
  description?: ReactNode;
  action?: ReactNode;
  /** "card" draws its own surface; "plain" sits inside an existing one (e.g. a table). */
  variant?: "card" | "plain";
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, variant = "card", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-12 text-center",
        variant === "card" && "rounded-xl bg-card ring-1 ring-border",
        className,
      )}
    >
      {/* Dotted ring echoes the route line used across the product. */}
      <span className="grid size-16 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
