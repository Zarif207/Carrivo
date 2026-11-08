"use client";

// Client: scrolls to the top (through Lenis when it runs) and moves focus to the page start.
import { ArrowUp } from "lucide-react";
import { scrollToTop } from "@/lib/motion/scroll";
import { cn } from "@/lib/utils";

export function BackToTop({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        scrollToTop();
        // Keyboard and screen-reader users land at the top too, not just the viewport.
        document.getElementById("top")?.focus({ preventScroll: true });
      }}
      className={cn(
        "inline-flex h-12 items-center gap-2 rounded-full bg-white/8 px-5 text-sm font-semibold text-sidebar-foreground ring-1 ring-sidebar-border transition-colors outline-none hover:bg-white/14 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
    >
      <ArrowUp className="size-4" aria-hidden="true" /> Back to top
    </button>
  );
}
