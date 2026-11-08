/*
 * Page scrolling helpers for the public site. Lenis registers itself here while it runs
 * (components/motion/lenis-scroll.tsx); everything else falls back to native scrolling.
 * Plain module: safe to import from server and client code (window is only read when called).
 */

interface SmoothScroller {
  scrollTo: (target: number | string | HTMLElement, options?: { immediate?: boolean }) => void;
}

let scroller: SmoothScroller | null = null;

export function setSmoothScroller(next: SmoothScroller | null): void {
  scroller = next;
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Back to the top: Lenis when it runs, otherwise native (instant under reduced motion). */
export function scrollToTop(): void {
  if (scroller) {
    scroller.scrollTo(0, { immediate: prefersReducedMotion() });
    return;
  }
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
