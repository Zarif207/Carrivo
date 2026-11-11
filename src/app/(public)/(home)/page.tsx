import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { HomeMotion } from "@/components/home/home-motion";
import { CoverageNetwork } from "@/components/home/coverage/coverage-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { Faq, FinalCta, Guarantees, Roles, Security, Services, TrackingExplainer, TrustStrip } from "@/components/home/sections";
import { PriceTeaser, PriceTeaserSkeleton } from "@/components/public/live-data";
import { Section } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { PRICE_EXAMPLE_WEIGHT_LB } from "@/lib/data/public";

export const metadata: Metadata = {
  title: { absolute: "Carrivo | Door-to-door delivery, tracked at every stop" },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: "Carrivo | Door-to-door delivery, tracked at every stop", description: SITE.description, url: "/" },
};

/**
 * Server component. All copy and live data render on the server; motion is layered on afterwards by
 * small client pieces (CSS for the hero, Framer Motion for buttons and tabs, GSAP loaded at idle).
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Services />
      <HowItWorks />
      <TrackingExplainer />

      {/* Coverage: zones, hubs and the route network, read live from the public API (cached for hours). */}
      <Section
        id="coverage"
        tone="dark"
        title="Where we deliver"
        intro="Every zone we serve, the hubs that sort its parcels, and the routes that link them. Read live from the Carrivo network."
      >
        {/* No <Suspense> here on purpose: the section is part of the static shell (see CoverageNetwork). */}
        <CoverageNetwork />
      </Section>

      {/* Pricing teaser: real quotes from POST /pricing/estimate. */}
      <Section
        id="pricing"
        title="Prices you see before you pay"
        intro={`A base fee covers the first pounds, then a fixed amount per extra pound. These are live quotes for a ${PRICE_EXAMPLE_WEIGHT_LB} lb parcel.`}
        action={
          <Button asChild variant="outline">
            <Link href="/pricing">
              Price your parcel <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        <div data-nav-section="/pricing">
          <Suspense fallback={<PriceTeaserSkeleton />}>
            <PriceTeaser />
          </Suspense>
        </div>
      </Section>

      <Guarantees />
      <Security />
      <Roles />
      <Faq />
      <FinalCta />

      <HomeMotion />
    </>
  );
}
