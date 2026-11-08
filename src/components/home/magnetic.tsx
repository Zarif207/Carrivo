"use client";

// Client: pointer-following "magnetic" pull on a CTA. The springs come from Framer Motion's animate(),
// imported on the first mouse move over a button, so the library is never part of the page's first
// load (and never downloaded on touch devices or with prefers-reduced-motion).
import { useRef, type PointerEvent, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion/scroll";

type Animate = typeof import("motion").animate;

let animateLoader: Promise<Animate> | null = null;
const loadAnimate = () => (animateLoader ??= import("motion").then((mod) => mod.animate));

/** How far the button may travel toward the pointer, as a share of the distance from its centre. */
const STRENGTH = 0.28;
const SPRING = { type: "spring", stiffness: 220, damping: 18, mass: 0.6 } as const;

export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const animateRef = useRef<Animate | null>(null);

  const moveTo = (x: number, y: number) => {
    const element = ref.current;
    const animate = animateRef.current;
    if (element && animate) animate(element, { x, y }, SPRING);
  };

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) * STRENGTH;
    const y = (event.clientY - (rect.top + rect.height / 2)) * STRENGTH;
    if (animateRef.current) {
      moveTo(x, y);
      return;
    }
    void loadAnimate().then((animate) => {
      animateRef.current = animate;
      moveTo(x, y);
    });
  };

  const reset = () => moveTo(0, 0);

  return (
    <span ref={ref} className={className ?? "inline-flex"} onPointerMove={onPointerMove} onPointerLeave={reset} onBlur={reset}>
      {children}
    </span>
  );
}
