"use client";

// Client: the sticky mobile bar on /drive-with-carrivo hides while one of the page's own CTA blocks
// ([data-cta-anchor]) is on screen, so the same button never shows twice. Without JavaScript it is
// simply always there (the <noscript> rule), and it only ever moves with transform: no layout shift.
import { useEffect, useState, type ReactNode } from "react";

export function StickyCtaBar({ children }: { children: ReactNode }) {
  // Start hidden: the hero's CTA is usually on screen at first, so the bar would only flash.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-cta-anchor]"));
    const visible = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
      setHidden([...visible.values()].some(Boolean));
    });
    for (const anchor of anchors) observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <noscript dangerouslySetInnerHTML={{ __html: "<style>[data-sticky-cta]{transform:none!important;opacity:1!important;visibility:visible!important}</style>" }} />
      <div
        data-sticky-cta=""
        data-hidden={hidden ? "" : undefined}
        inert={hidden}
        className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-overlay backdrop-blur transition-[transform,opacity,visibility] duration-300 data-[hidden]:invisible data-[hidden]:translate-y-full data-[hidden]:opacity-0 md:hidden"
      >
        {children}
      </div>
    </>
  );
}
