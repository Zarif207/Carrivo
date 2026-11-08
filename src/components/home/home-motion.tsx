"use client";

// Client: loads the GSAP chunk only after the page is interactive and the browser is idle, so GSAP
// never competes with the first paint (LCP) or hydration (TBT). Home page only.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const GsapScenes = dynamic(() => import("./gsap-scenes"), { ssr: false });

export function HomeMotion() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(id);
  }, []);

  return ready ? <GsapScenes /> : null;
}
