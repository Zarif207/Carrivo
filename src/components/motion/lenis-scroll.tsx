"use client";

// Client: Lenis smooth scrolling for the public pages (window scroll only; dashboards never load this).
import Lenis from "lenis";
import { useEffect } from "react";
import { REDUCED_MOTION_QUERY, setSmoothScroller } from "@/lib/motion/scroll";

/** Elements that scroll on their own or own the keyboard: Lenis leaves their wheel/touch events alone. */
const PREVENT = "[data-lenis-prevent], [role='dialog'], [role='menu'], [role='listbox'], [data-radix-popper-content-wrapper]";

export default function LenisScroll() {
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    let lenis: Lenis | null = null;
    let lockObserver: MutationObserver | null = null;

    const start = () => {
      if (media.matches || lenis) return; // reduced motion: native scrolling, no smoothing at all
      lenis = new Lenis({
        autoRaf: true,
        anchors: true, // in-page #links scroll smoothly too
        stopInertiaOnNavigate: true,
        prevent: (node) => node.closest(PREVENT) !== null,
      });
      setSmoothScroller(lenis);
      // Radix dialogs, sheets and menus lock the page with data-scroll-locked on <body>: pause with them.
      lockObserver = new MutationObserver(() => {
        if (document.body.hasAttribute("data-scroll-locked")) lenis?.stop();
        else lenis?.start();
      });
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    };

    const stop = () => {
      lockObserver?.disconnect();
      lockObserver = null;
      lenis?.destroy();
      lenis = null;
      setSmoothScroller(null);
    };

    const onPreferenceChange = () => (media.matches ? stop() : start());

    start();
    media.addEventListener("change", onPreferenceChange);
    return () => {
      media.removeEventListener("change", onPreferenceChange);
      stop();
    };
  }, []);

  return null;
}
