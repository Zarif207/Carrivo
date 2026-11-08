"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/scroll";

/** Below this the header always shows (the top of the page). */
const REVEAL_ZONE = 96;
/** Ignore tiny scroll jitters (trackpads, Lenis easing tails). */
const THRESHOLD = 6;

/**
 * Public header behaviour, without a motion library:
 * - hides while scrolling down and comes back on any scroll up (never under reduced motion, never
 *   while it holds keyboard focus or `pinned` is true, e.g. the mobile menu is open);
 * - writes reading progress (0 to 1) straight to the progress bar's transform, one rAF per frame,
 *   so scrolling never re-renders React.
 */
export function useScrollChrome({
  headerRef,
  progressRef,
  pinned,
}: {
  headerRef: RefObject<HTMLElement | null>;
  progressRef: RefObject<HTMLElement | null>;
  pinned: boolean;
}): boolean {
  const [hidden, setHidden] = useState(false);
  const pinnedRef = useRef(pinned);

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  useEffect(() => {
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;

      const delta = y - lastY;
      if (Math.abs(delta) < THRESHOLD) return;
      lastY = y;
      const keep = reduced.matches || pinnedRef.current || y < REVEAL_ZONE || headerRef.current?.contains(document.activeElement);
      setHidden(keep ? false : delta > 0);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Tabbing into a hidden header brings it back.
    const onFocusIn = () => setHidden(false);

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    const header = headerRef.current;
    header?.addEventListener("focusin", onFocusIn);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      header?.removeEventListener("focusin", onFocusIn);
    };
  }, [headerRef, progressRef]);

  return hidden && !pinned;
}

/**
 * The nav href whose home-page section is in the middle of the viewport. Sections opt in with
 * `data-nav-section="/services"`; pages without such sections return null.
 */
export function useActiveSection(pathname: string | null): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-section]"));
    if (sections.length === 0) return;
    const visible = new Map<HTMLElement, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target as HTMLElement, entry.isIntersecting);
        const current = sections.find((section) => visible.get(section));
        setActive(current?.dataset.navSection ?? null);
      },
      // A thin band across the middle of the viewport: one section at a time.
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const section of sections) observer.observe(section);
    return () => {
      observer.disconnect();
      setActive(null);
    };
  }, [pathname]);

  return active;
}
