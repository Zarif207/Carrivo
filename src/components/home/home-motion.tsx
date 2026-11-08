"use client";

// Client: loads the GSAP chunk only once the page has settled, so GSAP never competes with the first
// paint (LCP) or hydration (TBT). It starts on the visitor's first scroll, pointer or key input, or
// shortly after the load event when the browser is idle, whichever comes first. Home page only.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const GsapScenes = dynamic(() => import("./gsap-scenes"), { ssr: false });

const INPUT_EVENTS = ["scroll", "wheel", "pointermove", "pointerdown", "keydown", "touchstart"] as const;
/** After `load`: wait this long, then for an idle moment. */
const AFTER_LOAD_MS = 2500;

export function HomeMotion() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer = 0;
    let idle = 0;
    const start = () => setReady(true);
    const listen = { passive: true, once: true } as const;
    for (const type of INPUT_EVENTS) window.addEventListener(type, start, listen);

    const afterLoad = () => {
      timer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(start, { timeout: 2000 });
        else start();
      }, AFTER_LOAD_MS);
    };
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });

    return () => {
      for (const type of INPUT_EVENTS) window.removeEventListener(type, start);
      window.removeEventListener("load", afterLoad);
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);

  return ready ? <GsapScenes /> : null;
}
