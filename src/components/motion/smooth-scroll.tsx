"use client";

// Client: loads Lenis after hydration, in its own chunk, for the public layout only.
import dynamic from "next/dynamic";

const LenisScroll = dynamic(() => import("./lenis-scroll"), { ssr: false });

export function SmoothScroll() {
  return <LenisScroll />;
}
