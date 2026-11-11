// Client-only (imported by components/home/gsap-scenes.tsx, the home page's lazily loaded GSAP chunk,
// inside its reduced-motion-aware gsap.matchMedia context). The "Mobile app, coming soon" phone: the
// timeline steps through a delivery in a loop while the parcel pin travels the route, two alerts
// fade in and out, the phone floats and tilts with the scroll. Runs only while the section is on
// screen (IntersectionObserver); cleanup restores the server-rendered finished state.
import { gsap } from "gsap";
// MotionPathPlugin is registered by campaign-motion.ts, which gsap-scenes.tsx imports first.
import type { Cleanup } from "@/components/courier-campaign/campaign-motion";

/** Seconds each step stays current. */
const STEP = 1.8;

export function appTeaser(): Cleanup | undefined {
  const root = document.querySelector<HTMLElement>("[data-app-teaser]");
  if (!root) return undefined;
  const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-app-step]"));
  const status = root.querySelector<HTMLElement>("[data-app-status]");
  const path = root.querySelector<SVGPathElement>("[data-app-route]");
  const pin = root.querySelector<SVGGElement>("[data-app-pin]");
  const photo = root.querySelector<HTMLElement>("[data-app-photo]");
  const phone = root.querySelector<HTMLElement>("[data-app-phone]");
  const tilt = root.querySelector<HTMLElement>("[data-app-tilt]");
  const [outToast, deliveredToast] = Array.from(root.querySelectorAll<HTMLElement>("[data-app-toast]"));
  if (steps.length === 0 || !path || !pin) return undefined;
  const last = steps.length - 1;

  const setStep = (index: number) => {
    steps.forEach((step, i) => (step.dataset.state = i < index ? "done" : i === index ? "current" : "todo"));
    if (status) status.textContent = steps[index]?.dataset.label ?? "";
  };
  /** The pin's position along the route between two progress points (0 = pickup, 1 = door). */
  const along = (start: number, end: number) => ({ path, align: path, alignOrigin: [0.5, 1], start, end });

  const loop = gsap.timeline({ repeat: -1, paused: true });
  loop.set(pin, { motionPath: along(0, 0) }, 0);
  if (photo) loop.set(photo, { autoAlpha: 0.25 }, 0);
  steps.forEach((_, i) => {
    const at = i * STEP;
    loop.call(setStep, [i], at);
    if (i > 0) loop.to(pin, { motionPath: along((i - 1) / last, i / last), duration: 1.1, ease: "power1.inOut" }, at);
  });
  if (outToast) loop.fromTo(outToast, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 3 * STEP + 0.3).to(outToast, { autoAlpha: 0, y: -8, duration: 0.4 }, 3 * STEP + 1.7);
  if (photo) loop.to(photo, { autoAlpha: 1, duration: 0.4 }, last * STEP + 0.2);
  if (deliveredToast) {
    loop.fromTo(deliveredToast, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, last * STEP + 0.4).to(deliveredToast, { autoAlpha: 0, y: -8, duration: 0.4 }, last * STEP + 2.8);
  }
  loop.to({}, { duration: 0.6 }); // a beat on the finished state before it starts over
  gsap.set([outToast, deliveredToast].filter(Boolean), { autoAlpha: 0 });

  const float = phone ? gsap.to(phone, { y: -10, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true }) : null;
  // Scroll parallax: the phone tilts a little as the section passes (scrubbed, so it costs nothing while still).
  if (tilt) {
    gsap.fromTo(tilt, { rotate: -4, yPercent: 4 }, { rotate: 3, yPercent: -4, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  }

  const observer = new IntersectionObserver(([entry]) => {
    const visible = Boolean(entry?.isIntersecting);
    for (const tween of [loop, float]) {
      if (!tween) continue;
      if (visible) tween.play();
      else tween.pause();
    }
  });
  observer.observe(root);

  return () => {
    observer.disconnect();
    setStep(last); // the server's finished state (the context revert restores the moved elements)
  };
}
