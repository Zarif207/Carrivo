"use client";

// Client: every GSAP effect on the home page, in one lazily loaded chunk (see home-motion.tsx).
// Nothing here creates content: it only moves, reveals or emphasises server-rendered markup.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
// Registers ScrollTrigger and MotionPathPlugin; also the courier campaign band's motion.
import { homeCampaign, originOf, progressAt, type Cleanup } from "@/components/courier-campaign/campaign-motion";
import { appTeaser } from "./app-teaser-motion";

/** Hero corridor: the courier and the parcels loop along the route and the dashes flow; paused while off screen. */
function heroRoute(): void {
  const root = document.querySelector<HTMLElement>("[data-route-visual]");
  const path = root?.querySelector<SVGPathElement>("[data-route-path]");
  if (!root || !path) return;

  const parcels = gsap.utils.toArray<SVGGElement>(root.querySelectorAll("[data-parcel]"));
  const loops = parcels.map((parcel) => {
    const { x, y } = originOf(parcel);
    return gsap
      .to(parcel, {
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
        duration: 14,
        ease: "none",
        repeat: -1,
      })
      .progress(progressAt(path, x, y));
  });
  // The courier rides on its wheels (origin at the bottom of the drawing) and leans with the road.
  const scooter = root.querySelector<SVGGElement>("[data-scooter]");
  if (scooter) {
    const { x, y } = originOf(scooter);
    loops.push(
      gsap
        .to(scooter, { motionPath: { path, align: path, alignOrigin: [0.55, 1], autoRotate: true }, duration: 18, ease: "none", repeat: -1 })
        .progress(progressAt(path, x, y)),
    );
  }
  const flow = gsap.to(path, { strokeDashoffset: -110, duration: 2.6, ease: "none", repeat: -1 });

  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      for (const tween of [...loops, flow]) {
        if (self.isActive) tween.play();
        else tween.pause();
      }
    },
  });
}

/** Final call to action: the van drives in from the left once, when it scrolls into view. */
function ctaVan(): void {
  const van = document.querySelector<SVGGElement>("[data-cta-van]");
  // Only when it starts below the fold, so nothing on screen jumps.
  if (!van || van.getBoundingClientRect().top < window.innerHeight) return;
  gsap.from(van, {
    x: -140,
    opacity: 0,
    duration: 1.4,
    ease: "power3.out",
    scrollTrigger: { trigger: van, start: "top 92%", once: true },
  });
}

/**
 * Cards rise in as they enter. Only items still below the fold are touched, so nothing on the
 * first screen ever starts hidden; a focused item is revealed at once (keyboard users never tab
 * into something invisible).
 */
function reveals(): Cleanup {
  const items = gsap.utils
    .toArray<HTMLElement>("[data-reveal]")
    .filter((item) => item.getBoundingClientRect().top > window.innerHeight * 0.92);
  gsap.set(items, { y: 28, autoAlpha: 0.001 });

  ScrollTrigger.batch(items, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });

  const onFocusIn = (event: FocusEvent) => {
    const item = (event.target as Element | null)?.closest<HTMLElement>("[data-reveal]");
    if (item && items.includes(item)) gsap.to(item, { y: 0, autoAlpha: 1, duration: 0.2, overwrite: true });
  };
  document.addEventListener("focusin", onFocusIn);
  return () => document.removeEventListener("focusin", onFocusIn);
}

/** Desktop: pin "How it works" and step through it with the scroll position. */
function pinnedSteps(): Cleanup | undefined {
  const pin = document.querySelector<HTMLElement>("[data-steps-pin]");
  if (!pin) return undefined;
  const steps = gsap.utils.toArray<HTMLElement>(pin.querySelectorAll("[data-step]"));
  const screens = gsap.utils.toArray<HTMLElement>(pin.querySelectorAll("[data-step-screen]"));
  const count = steps.length;
  if (count === 0) return undefined;

  let current = -1;
  const setActive = (index: number) => {
    if (index === current) return;
    current = index;
    steps.forEach((step, i) => (step.dataset.active = String(i === index)));
    screens.forEach((screen, i) => (screen.dataset.active = String(i === index)));
  };
  setActive(0);

  ScrollTrigger.create({
    trigger: pin,
    pin: true,
    start: "top top",
    // About 70% of a screen of scrolling per step.
    end: () => `+=${Math.round(window.innerHeight * 0.7 * (count - 1))}`,
    invalidateOnRefresh: true,
    anticipatePin: 1,
    onUpdate: (self) => setActive(Math.min(count - 1, Math.floor(self.progress * count))),
  });

  return () => {
    for (const element of [...steps, ...screens]) delete element.dataset.active;
  };
}

export default function GsapScenes() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" },
      (context) => {
        const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        // Reduced motion: no scrubbing, no pinning, no reveals; everything is already visible.
        if (!motion) return undefined;
        heroRoute();
        ctaVan();
        const cleanups = [reveals(), desktop ? pinnedSteps() : undefined, homeCampaign(), appTeaser()];
        return () => {
          for (const cleanup of cleanups) cleanup?.();
        };
      },
    );

    // Streamed sections (coverage, prices) change the page height after load: re-measure.
    let timer = 0;
    const main = document.getElementById("main");
    const resize = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    if (main) resize.observe(main);

    return () => {
      window.clearTimeout(timer);
      resize.disconnect();
      mm.revert(); // kills every tween, pin and ScrollTrigger created above and restores inline styles
    };
  }, []);

  return null;
}
