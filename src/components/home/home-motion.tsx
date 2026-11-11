"use client";

// Client: loads the GSAP chunk only once the page has settled (hooks/use-idle-start.ts), so GSAP never
// competes with the first paint (LCP) or hydration (TBT). Home page only.
import dynamic from "next/dynamic";
import { useIdleStart } from "@/hooks/use-idle-start";

const GsapScenes = dynamic(() => import("./gsap-scenes"), { ssr: false });

export function HomeMotion() {
  return useIdleStart() ? <GsapScenes /> : null;
}
