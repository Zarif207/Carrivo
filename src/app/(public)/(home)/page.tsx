import { ArrowRight, Bike, Camera, Clock3, CreditCard, PackageCheck, RotateCcw, Timer, Truck, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardPreview } from "@/components/public/dashboard-preview";
import { NetworkFacts, NetworkFactsSkeleton, PriceTeaser, PriceTeaserSkeleton } from "@/components/public/live-data";
import { Container, FeatureCard, Section } from "@/components/public/section";
import { TrackingForm } from "@/components/public/tracking-form";
import { Button } from "@/components/ui/button";
import { EXAMPLE_TRACKING_ID, SITE } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: "Carrivo | Parcel delivery across Dhaka, tracked to the door" },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: "Carrivo | Parcel delivery across Dhaka", description: SITE.description, url: "/" },
};

const STEPS = [
  {
    icon: <PackageCheck />,
    title: "Book and see the price",
    body: "Enter the pickup and delivery addresses, the weight and a service. The price is worked out for you before you pay.",
  },
  {
    icon: <CreditCard />,
    title: "Pay online",
    body: "Pay by card through Stripe. Nothing is scheduled until the payment is confirmed.",
  },
  {
    icon: <Clock3 />,
    title: "Choose a pickup window",
    body: "Pick a window of up to 12 hours, any day in the next 30. A courier from your zone collects the parcel at your door.",
  },
  {
    icon: <Truck />,
    title: "Follow it to the door",
    body: "See every stop: picked up, at the hub, out for delivery, delivered, with the hand-over photo when the courier adds one.",
  },
];

const SERVICES = [
  { icon: <Truck />, title: "Standard", body: "The everyday option for parcels that aren't urgent, inside a zone or between zones." },
  { icon: <Zap />, title: "Express", body: "A faster, higher-priced service for parcels that need to arrive sooner." },
  { icon: <Timer />, title: "Same day", body: "Picked up and delivered on the same day, for parcels that stay inside one zone." },
];

const PROMISES = [
  { icon: <Camera />, text: "Hand-over photos appear on your shipment page" },
  { icon: <RotateCcw />, text: "Cancel any time before pickup and get a full refund" },
  { icon: <Bike />, text: "Up to three delivery attempts before a parcel is returned" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-20 lg:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-20%] size-[48rem] rounded-full bg-brand-soft opacity-70 blur-3xl dark:opacity-40" />
        <Container className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 id="hero-heading" className="font-display text-display-1 lg:text-[3.75rem] xl:text-[4.5rem]">
                Parcels across Dhaka, tracked to the door.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
                Book a courier in a few minutes, pay online, and follow your parcel at every stop from pickup to delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Send a parcel <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">Get a price</Link>
              </Button>
            </div>
            <TrackingForm
              className="max-w-xl"
              hint={
                <>
                  Try the demo parcel{" "}
                  <Link href={`/track/${EXAMPLE_TRACKING_ID}`} className="font-id font-semibold text-foreground underline underline-offset-4">
                    {EXAMPLE_TRACKING_ID}
                  </Link>
                </>
              }
            />
          </div>
          <DashboardPreview />
        </Container>
      </section>

      {/* How it works */}
      <Section id="how-it-works" title="How it works" intro="Four steps from booking to the receiver's door.">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-full bg-secondary [&_svg]:size-6" aria-hidden="true">
                  {step.icon}
                </span>
                <span className="text-sm font-bold text-muted-foreground tabular">Step {index + 1}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Services */}
      <Section
        id="services"
        title="Three ways to send"
        intro="Every service includes doorstep pickup and tracking at every stop."
        action={
          <Button asChild variant="outline">
            <Link href="/services">
              All services <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
        className="pt-0 sm:pt-0 lg:pt-0"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICES.map((service) => (
            <FeatureCard key={service.title} icon={service.icon} title={service.title}>
              <p>{service.body}</p>
            </FeatureCard>
          ))}
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {PROMISES.map((promise) => (
            <li key={promise.text} className="flex items-start gap-3 rounded-xl bg-surface p-4 [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0">
              {promise.icon}
              <span className="font-medium">{promise.text}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Network facts */}
      <Section id="network" tone="dark" title="The network today" intro="Zones and hubs are read live from the Carrivo network.">
        <Suspense fallback={<NetworkFactsSkeleton />}>
          <NetworkFacts />
        </Suspense>
      </Section>

      {/* Pricing teaser */}
      <Section
        id="pricing"
        title="Simple prices"
        intro="A base fee for the first kilogram, then a fixed amount for each extra kilogram. These are live quotes for a 1 kg parcel."
        action={
          <Button asChild variant="outline">
            <Link href="/pricing">
              Price your parcel <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        <Suspense fallback={<PriceTeaserSkeleton />}>
          <PriceTeaser />
        </Suspense>
      </Section>

      {/* Final CTA */}
      <section aria-labelledby="cta-heading" className="pb-20 sm:pb-24">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-[1.75rem] bg-card p-8 shadow-raised sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 id="cta-heading" className="font-display text-display-2">
                Ready to send your first parcel?
              </h2>
              <p className="text-lg text-muted-foreground">Create a free account, book in a few minutes and pay only for what you send.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Create an account <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
