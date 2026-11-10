import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Frames for the home page's product pictures. The screen inside is inert (nothing can be focused
 * or clicked, and it's out of the accessibility tree); the visible caption says what it shows.
 */

export function PhoneFrame({ children, caption, className }: { children: ReactNode; caption: ReactNode; className?: string }) {
  return (
    <figure className={cn("mx-auto w-full max-w-[21rem]", className)}>
      <div inert className="relative rounded-[2.75rem] bg-ink p-2.5 shadow-overlay">
        <span aria-hidden="true" className="absolute top-4 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-ink-foreground/20" />
        <div className="space-y-4 overflow-hidden rounded-[2.25rem] bg-background px-4 pt-9 pb-5 text-foreground">{children}</div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
