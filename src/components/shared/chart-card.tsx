import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  /** A short line under the title, e.g. "Last 30 days". */
  description?: ReactNode;
  /** Headline figure shown above the chart (orange is reserved for the chart line, so this stays ink). */
  value?: ReactNode;
  /** Top-right control, e.g. a <TimeRangeSwitcher size="sm" />. */
  action?: ReactNode;
  /** Text summary of the chart for screen readers (and anyone who can't read the graph). */
  summary?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** White 20px card that frames any chart with a title, optional figure, control and summary. */
export function ChartCard({ title, description, value, action, summary, children, footer, className }: ChartCardProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-5 rounded-xl bg-card p-6 text-card-foreground shadow-card", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-bold">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          {value ? <p className="pt-1 text-[1.75rem] leading-none font-extrabold tracking-tight tabular">{value}</p> : null}
        </div>
        {action ? <div className="max-w-full min-w-0">{action}</div> : null}
      </header>
      <div className="min-w-0">{children}</div>
      {summary ? <p className="sr-only">{summary}</p> : null}
      {footer ? <footer className="border-t border-border pt-4 text-sm text-muted-foreground">{footer}</footer> : null}
    </section>
  );
}
