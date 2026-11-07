import { BadgeDollarSign, Lock, Route, Scale } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PriceCalculator } from "@/components/public/price-calculator";
import { Container, FeatureCard, Section } from "@/components/public/section";
import { getPublicZones } from "@/lib/data/public";
import { CalculatorSkeleton } from "./calculator-skeleton";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Get an exact price for your parcel: choose the zones, the weight and Standard, Express or Same day delivery.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Carrivo pricing", url: "/pricing" },
};

const RULES = [
  { icon: <BadgeDollarSign />, title: "Base fee", body: "Covers the first kilogram on that route and service." },
  { icon: <Scale />, title: "Per extra kilogram", body: "Each started kilogram above that adds a fixed amount, so 2.3 kg is charged as 2 extra kg." },
  { icon: <Route />, title: "Route and service", body: "Prices depend on the start and end zones and the service. Same day runs inside one zone." },
  { icon: <Lock />, title: "Fixed once you pay", body: "The price is saved with your booking. A paid shipment can't change weight or service." },
];

/** Zones are request-time data here (the page shell is static), so they render under <Suspense>. */
async function Calculator() {
  await connection();
  let zones;
  try {
    zones = await getPublicZones();
  } catch {
    return (
      <p className="rounded-2xl bg-card p-8 text-muted-foreground shadow-card" role="alert">
        Prices can&rsquo;t be loaded right now. Refresh the page in a moment to try again.
      </p>
    );
  }
  if (zones.length === 0) {
    return <p className="rounded-2xl bg-card p-8 text-muted-foreground shadow-card">No delivery zones are open yet, so there are no prices to show.</p>;
  }
  return <PriceCalculator zones={zones} />;
}

export default function PricingPage() {
  return (
    <>
      <section className="pt-14 pb-16 sm:pt-20">
        <Container className="space-y-10">
          <div className="max-w-3xl space-y-5">
            <h1 className="font-display text-display-1">Know the price before you book.</h1>
            <p className="text-xl text-muted-foreground">
              Pick the zones, enter the weight and choose a service. You get the same price a real booking would charge.
            </p>
          </div>
          <Suspense fallback={<CalculatorSkeleton />}>
            <Calculator />
          </Suspense>
        </Container>
      </section>

      <Section id="how-pricing-works" title="How prices work" className="pt-0 sm:pt-0 lg:pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((rule) => (
            <FeatureCard key={rule.title} icon={rule.icon} title={rule.title}>
              <p>{rule.body}</p>
            </FeatureCard>
          ))}
        </div>
      </Section>
    </>
  );
}
