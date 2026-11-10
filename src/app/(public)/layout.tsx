import { PublicSiteHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Focus target for "Back to top" (the page start). */}
      <span id="top" tabIndex={-1} className="sr-only">
        Top of page
      </span>
      <SmoothScroll />
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-signal px-4 py-2 font-semibold text-signal-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PublicSiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
