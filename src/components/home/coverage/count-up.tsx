"use client";

// Client: counts up to the server-rendered value once, the first time it scrolls into view.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion/scroll";

/**
 * Renders `value` on the server (and without JS). In the browser, a number that starts off screen
 * resets to 0 and counts up when it appears; one already on screen, or under reduced motion, stays put.
 * Screen readers get the final value only.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion() || value === 0) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    setShown(0);
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      setShown(value);
    };
  }, [value]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular">
        {shown}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
