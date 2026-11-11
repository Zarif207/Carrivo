/*
 * Page scrolling helpers for the public site. Lenis registers itself here while it runs
 * (components/motion/lenis-scroll.tsx); everything else falls back to native scrolling.
 * Plain module: safe to import from server and client code (window is only read when called).
 */

interface SmoothScroller {
  scrollTo: (target: number | string | HTMLElement, options?: { immediate?: boolean; onComplete?: () => void }) => void;
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

/**
 * Centre an element in the viewport: Lenis when it runs (native scrolling would fight it), else native.
 * Layout above can still move while scrolling (GSAP adds its pin spacers once it loads), so when the
 * scroll ends it checks again and corrects once.
 */
export function scrollIntoCenter(element: HTMLElement, retry = true): void {
  const targetTop = () => {
    const rect = element.getBoundingClientRect();
    return Math.max(0, window.scrollY + rect.top - Math.max(80, (window.innerHeight - rect.height) / 2));
  };
  const onComplete = () => {
    const rect = element.getBoundingClientRect();
    if (retry && (rect.bottom < 0 || rect.top > window.innerHeight)) scrollIntoCenter(element, false);
  };
  if (scroller) {
    scroller.scrollTo(targetTop(), { immediate: prefersReducedMotion(), onComplete });
    return;
  }
  window.scrollTo({ top: targetTop(), behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
