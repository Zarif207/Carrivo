"use client";

// Client: /drive-with-carrivo's GSAP chunk, loaded once the page has settled (like the home page's).
import dynamic from "next/dynamic";
import { useIdleStart } from "@/hooks/use-idle-start";

const DriveScenes = dynamic(() => import("./drive-scenes"), { ssr: false });

export function DriveMotion() {
  return useIdleStart() ? <DriveScenes /> : null;
}
