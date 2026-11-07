import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page-width wrapper used by every public section. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

interface SectionProps {
  id?: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Right-aligned link or button next to the heading (wraps under it on mobile). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** "dark" renders an ink band (used once per page at most). */
  tone?: "default" | "dark";
}

export function Section({ id, title, intro, action, children, className, tone = "default" }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("py-16 sm:py-20 lg:py-24", tone === "dark" && "bg-ink text-ink-foreground", className)}
    >
      <Container>
        <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 id={headingId} className="font-display text-display-2">
              {title}
            </h2>
            {intro ? <p className={cn("text-lg", tone === "dark" ? "text-sidebar-muted" : "text-muted-foreground")}>{intro}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </Container>
    </section>
  );
}

/** Large rounded content card for public pages. */
export function FeatureCard({
  icon,
  title,
  children,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl bg-card p-6 text-card-foreground shadow-card sm:p-7", className)}>
      {icon ? <span className="grid size-12 place-items-center rounded-full bg-secondary text-foreground [&_svg]:size-6">{icon}</span> : null}
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </div>
  );
}
