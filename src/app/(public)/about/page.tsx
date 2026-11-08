import { ArrowRight, BadgeDollarSign, Bike, ClipboardCheck, Headset, LockKeyhole, ReceiptText, UserRound, Warehouse } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container, FeatureCard, Section } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: "Carrivo is a US courier service for people and small businesses sending parcels within and between our metro zones, with clear prices and tracking at every stop.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Carrivo", url: "/about" },
};

const PRINCIPLES = [
  {
    icon: <BadgeDollarSign />,
    title: "The price comes first",
    body: "You see the full price before you pay. It's worked out from the zones, the weight and the service, and it's fixed once you've paid.",
  },
  {
    icon: <ClipboardCheck />,
    title: "Every move is written down",
    body: "Each status change records who made it, when and at which hub. The same history appears on your shipment page.",
  },
  {
    icon: <LockKeyhole />,
    title: "Tracking without your details",
    body: "Anyone with a tracking ID sees the status and the city, never names, phone numbers, addresses or prices.",
  },
  {
    icon: <ReceiptText />,
    title: "Fair when plans change",
    body: "Cancel before pickup and a paid shipment is refunded in full to the card you used.",
  },
];

const PEOPLE = [
  {
    icon: <UserRound />,
    title: "Senders",
    body: "Book shipments, pay online, choose a pickup window and follow each parcel from their dashboard.",
  },
  {
    icon: <Bike />,
    title: "Couriers",
    body: "Collect parcels in their own zone, mark pickups and deliveries from their phone, and add a photo when they hand a parcel over.",
  },
  {
    icon: <Warehouse />,
    title: "Hub and operations staff",
    body: "Sort parcels at the hubs, assign couriers, handle returns and refunds, and keep prices and zones up to date.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="pt-14 pb-4 sm:pt-20">
        <Container className="max-w-4xl space-y-6">
          <h1 className="font-display text-display-1">Delivery you can follow, at a price you see first.</h1>
          <p className="text-xl text-muted-foreground">
            Carrivo is a US courier service for people and small businesses sending parcels within and between our metro zones. We collect
            from your door, sort at our hubs and deliver to the receiver, and you can see each step as it happens.
          </p>
        </Container>
      </section>

      <Section id="principles" title="What we hold ourselves to">
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title}>
              <p>{item.body}</p>
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section id="people" title="Who moves your parcel" intro="Three groups share one record of every shipment, so nobody has to guess where a parcel is." className="pt-0 sm:pt-0 lg:pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {PEOPLE.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title}>
              <p>{item.body}</p>
            </FeatureCard>
          ))}
        </div>
      </Section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <div className="flex flex-col gap-6 rounded-[1.75rem] bg-ink p-8 text-ink-foreground sm:p-12 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
                <Headset className="size-6" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight">Questions about a delivery?</h2>
                <p className="text-sidebar-muted">
                  Our support team answers by email, Monday to Saturday ({SITE.timeZoneLabel}).
                </p>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href="/contact">
                Contact us <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
