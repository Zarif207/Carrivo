"use client";

// Client: pointer-following "magnetic" pull on a CTA (Framer Motion springs). The child renders on the
// server as-is; the effect is skipped for touch pointers and for prefers-reduced-motion.
import { LazyMotion, m, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.loadDomAnimation());

/** How far the button may travel toward the pointer, as a share of the distance from its centre. */
const STRENGTH = 0.28;
const SPRING = { stiffness: 220, damping: 18, mass: 0.6 };

export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * STRENGTH);
    y.set((event.clientY - (rect.top + rect.height / 2)) * STRENGTH);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <LazyMotion features={loadFeatures}>
      <m.span
        className={className ?? "inline-flex"}
        style={reduce ? undefined : { x: springX, y: springY }}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onBlur={reset}
      >
        {children}
      </m.span>
    </LazyMotion>
  );
}
