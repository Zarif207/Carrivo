"use client";

// Client: every GSAP effect on /drive-with-carrivo (lazily loaded by drive-motion.tsx). It only moves
// server-rendered markup; nothing starts hidden, and reduced motion gets none of it.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { panorama, timelineFill } from "./campaign-motion";

export default function DriveScenes() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cleanup = panorama();
      timelineFill();
      return cleanup;
    });

    // The zone grid can stream in after load and change the page height: re-measure.
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
      mm.revert();
    };
  }, []);

  return null;
}
