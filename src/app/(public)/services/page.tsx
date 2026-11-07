import { ArrowRight, CalendarClock, Camera, CreditCard, MapPinned, RotateCcw, Route, Scale, Timer, Truck, Undo2, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CoverageList, CoverageSkeleton } from "@/components/public/live-data";
import { Container, FeatureCard, Section } from "@/components/public/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description: "Standard, Express and Same day parcel delivery across Dhaka, with doorstep pickup, tracking at every stop and refunds before pickup.",
  alternates: { canonical: "/services" },
  openGraph: { title: "Carrivo services", url: "/services" },
};

const SERVICES = [
  {
    icon: <Truck />,
    title: "Standard",
    when: "For everyday parcels",
    points: ["Inside a zone or between zones", "The lowest price for each route", "Pickup window of your choice"],
  },
  {
    icon: <Zap />,
    title: "Express",
    when: "When it needs to arrive sooner",
    points: ["Inside a zone or between zones", "Higher price than Standard on the same route", "Same tracking and hand-over photo"],
  },
  {
    icon: <Timer />,
    title: "Same day",
    when: "Picked up and delivered the same day",
    points: ["Inside one zone only", "Pickup window of your choice", "Same tracking and hand-over photo"],
  },
];

const INCLUDED = [
  { icon: <CalendarClock />, title: "Doorstep pickup", body: "Choose a pickup window of up to 12 hours, any day in the next 30 days." },
  { icon: <Route />, title: "Tracking at every stop", body: "Picked up, at the origin hub, in transit, at the destination hub, out for delivery." },
  { icon: <Camera />, title: "Hand-over photo", body: "When the courier adds a delivery photo, it appears on your shipment page." },
  { icon: <CreditCard />, title: "Secure card payment", body: "Pay through Stripe Checkout. We never see or store your card number." },
  { icon: <RotateCcw />, title: "Refund before pickup", body: "Cancel a paid shipment before it's picked up and the full amount goes back to your card." },
  { icon: <Undo2 />, title: "Three delivery attempts", body: "If the receiver can't be reached, the courier tries again, up to three times, before it's returned." },
];

export default function ServicesPage() {
  return (
    <>
      <section className="pt-14 pb-4 sm:pt-20">
        <Container className="max-w-4xl space-y-6">
          <h1 className="font-display text-display-1">One parcel, three speeds.</h1>
          <p className="text-xl text-muted-foreground">
            Every service includes doorstep pickup and tracking at every stop. The difference is how fast it moves and what it costs.
          </p>
        </Container>
      </section>

      <Section id="services" title="Choose a service">
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICES.map((service) => (
            <FeatureCard key={service.title} icon={service.icon} title={service.title}>
              <p className="font-semibold text-foreground">{service.when}</p>
              <ul className="space-y-2">
                {service.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                    {point}
                  </li>
                ))}
              </ul>
            </FeatureCard>
          ))}
        </div>
        <p className="mt-6 flex items-start gap-2 text-muted-foreground">
          <Scale className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Each service has a weight limit for each route. The price calculator tells you straight away if a parcel is over it.
        </p>
      </Section>

      <Section id="included" title="Included with every shipment" className="pt-0 sm:pt-0 lg:pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title}>
              <p>{item.body}</p>
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section
        id="coverage"
        title="Where we deliver"
        intro="Our zones and hubs, read live from the Carrivo network."
        action={
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MapPinned className="size-4" aria-hidden="true" /> Updated as the network grows
          </span>
        }
      >
        <Suspense fallback={<CoverageSkeleton />}>
          <CoverageList />
        </Suspense>
      </Section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <div className="flex flex-col gap-6 rounded-[1.75rem] bg-card p-8 shadow-raised sm:p-12 md:flex-row md:items-center md:justify-between">
            <h2 className="font-display text-display-3 max-w-xl">See the exact price for your parcel before you book.</h2>
            <Button asChild size="lg">
              <Link href="/pricing">
                Get a price <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
