// Framer Motion feature bundles, loaded on demand by <LazyMotion> (keeps them out of the first load).
import { domAnimation, domMax } from "motion/react";

export const loadDomAnimation = () => Promise.resolve(domAnimation);
export const loadDomMax = () => Promise.resolve(domMax);
