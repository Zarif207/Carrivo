import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Camera,
  CreditCard,
  EyeOff,
  FileClock,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardPreview } from "@/components/public/dashboard-preview";
import { Container, Section } from "@/components/public/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";
import { CtaVan } from "./illustrations/cta-van";
import { ServiceScene } from "./illustrations/service-scenes";
import { TrackingPhone } from "./illustrations/tracking-phone";
import { Magnetic } from "./magnetic";
import { RoleTabs, type RoleTab } from "./role-tabs";

/*
 * Home page sections that don't read live data. Everything stated here is a product rule the app
 * enforces (prices, refunds, attempts, roles); nothing is a made-up number. [data-reveal] items rise
 * in once GSAP has loaded (only when they start below the fold, and never under reduced motion).
 */

/* ───────────── Trust strip ───────────── */

const TRUST = [
  { icon: <CreditCard />, text: "Card payments through Stripe" },
  { icon: <Camera />, text: "Hand-over photos on delivery" },
  { icon: <RotateCcw />, text: "Refund if you cancel before pickup" },
  { icon: <Truck />, text: "Up to 3 delivery attempts" },
];

export function TrustStrip() {
  return (
    <section aria-label="What every booking includes" className="border-y border-border bg-surface">
      <Container>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => (
            <li key={item.text} className="flex items-center gap-3 font-semibold [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-brand-text">
              {item.icon}
              {item.text}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ───────────── Services ───────────── */

const SERVICES = [
  {
    service: "STANDARD",
    title: "Standard",
    body: "The everyday service for parcels that aren’t urgent, within a metro zone or between zones.",
    note: "Within a zone and between zones",
  },
  {
    service: "EXPRESS",
    title: "Express",
    body: "Our faster service, priced higher, for parcels that need to arrive sooner.",
    note: "Within a zone and between zones",
  },
  {
    service: "SAME_DAY",
    title: "Same day",
    body: "Collected and handed over on the same day, inside one metro zone. Offered only on routes with a same-day price; the quote tells you.",
    note: "Within one zone only",
  },
] as const;

export function Services() {
  return (
    <Section
      id="services"
      title="Three ways to send"
      intro="Every service includes doorstep pickup, a price before you pay, and tracking at every stop."
      action={
        <Button asChild variant="outline">
          <Link href="/services">
            Compare services <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <div data-nav-section="/services" className="grid gap-4 md:grid-cols-3">
        {SERVICES.map((service, i) => (
          <article
            key={service.title}
            data-reveal=""
            className={cn(
              "group relative flex flex-col gap-5 overflow-hidden rounded-2xl p-7 shadow-card transition-transform duration-300 hover:-translate-y-1",
              i === 1 ? "bg-ink text-ink-foreground" : "bg-card text-card-foreground",
            )}
          >
            <ServiceScene service={service.service} className="-ml-1" />
            <h3 className="font-display text-2xl tracking-tight">{service.title}</h3>
            <p className={i === 1 ? "text-sidebar-muted" : "text-muted-foreground"}>{service.body}</p>
            <p className={cn("mt-auto border-t pt-4 text-sm font-semibold", i === 1 ? "border-sidebar-border" : "border-border")}>{service.note}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ───────────── Live tracking and proof of delivery ───────────── */

export function TrackingExplainer() {
  return (
    <Section
      id="tracking"
      title="Live tracking, with proof at the door"
      intro="Every status change is a timestamped stop. Anyone with the tracking ID can follow it; only you see the details."
    >
      <div data-nav-section="/track" className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <TrackingPhone />

        <div className="grid gap-4">
          {[
            {
              icon: <EyeOff />,
              title: "Public page, private details",
              body: "The public tracking page shows the stops and times only: no names, phone numbers or addresses. Senders see the full shipment in their account.",
            },
            {
              icon: <Camera />,
              title: "A photo at hand-over",
              body: "Couriers can take the proof-of-delivery photo with the phone camera; it’s compressed on the device and attached to the shipment for the sender to see.",
            },
            {
              icon: <BadgeCheck />,
              title: "Notified as it moves",
              body: "Payment confirmed, courier assigned, out for delivery, delivered: each change lands in your notifications.",
            },
          ].map((item) => (
            <article key={item.title} data-reveal="" className="flex gap-4 rounded-2xl bg-card p-6 shadow-card">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary [&_svg]:size-5" aria-hidden="true">
                {item.icon}
              </span>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ───────────── Guarantees (honest) ───────────── */

const PROMISES = [
  { title: "The price is fixed when you pay", body: "The API prices every booking. Editing weight or service before payment re-prices it; after payment it’s locked." },
  { title: "Cancel before pickup, get it back", body: "Cancel any time before the courier picks the parcel up. If you’ve paid, the payment is refunded to your card." },
  { title: "Three tries at the door", body: "If nobody can receive it, the courier tries again, up to three attempts, before the parcel is returned to you." },
  { title: "Every stop on record", body: "Each status change is timestamped on your tracking page and in an audit trail." },
];

const NOT_PROMISED = [
  { title: "A delivery date", body: "We don’t publish transit-time guarantees. Express is the faster service; Same day is for hand-over the day it’s collected, within one zone." },
  { title: "Insurance", body: "You can record a declared value on a shipment, but Carrivo doesn’t sell parcel insurance." },
  { title: "A photo every time", body: "Hand-over photos are added by the courier when they can, so not every delivery has one." },
];

export function Guarantees() {
  return (
    <Section id="promises" title="What we promise, and what we don’t" intro="Plain rules the app enforces, and the limits we’d rather tell you up front.">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div data-reveal="" className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="size-5 text-brand-text" aria-hidden="true" /> We promise
          </h3>
          <ul className="grid gap-5 sm:grid-cols-2">
            {PROMISES.map((item) => (
              <li key={item.title} className="space-y-1.5">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal="" className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-8">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
            <Ban className="size-5 text-muted-foreground" aria-hidden="true" /> We don&rsquo;t promise
          </h3>
          <ul className="space-y-5">
            {NOT_PROMISED.map((item) => (
              <li key={item.title} className="space-y-1.5">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ───────────── Security and trust ───────────── */

const SECURITY: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <CreditCard />, title: "Cards stay with Stripe", body: "Checkout is hosted by Stripe. Card numbers never reach Carrivo’s servers, and a payment is only marked paid after Stripe confirms it." },
  { icon: <KeyRound />, title: "Sessions out of reach", body: "Your session lives in an httpOnly cookie that page scripts can’t read, and signing out revokes it on the server." },
  { icon: <Lock />, title: "Only your parcels", body: "Customers see their own shipments, couriers only the ones assigned to them. Anyone else’s record answers “not found”." },
  { icon: <FileClock />, title: "Every admin action logged", body: "Assignments, status changes, refunds and account changes are written to an audit log, with secrets redacted." },
];

export function Security() {
  return (
    <Section id="security" tone="dark" title="Built to be trusted" intro="Security decisions that protect your money and your data.">
      <div className="grid gap-4 sm:grid-cols-2">
        {SECURITY.map((item) => (
          <article key={item.title} data-reveal="" className="flex gap-4 rounded-2xl bg-white/5 p-6 ring-1 ring-sidebar-border">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground [&_svg]:size-5" aria-hidden="true">
              {item.icon}
            </span>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
              <p className="text-sidebar-muted">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ───────────── Role-based experience ───────────── */

const ROLES: RoleTab[] = [
  {
    id: "customer",
    label: "Customers",
    title: "Send, pay and follow from one account.",
    points: [
      "Book in three steps with a live price",
      "Pay by card on Stripe Checkout",
      "Choose a pickup window up to 30 days ahead",
      "Follow every stop and see the hand-over photo",
      "Cancel before pickup with an automatic refund",
      "Payment history and notifications in one place",
    ],
    preview: <DashboardPreview />,
  },
  {
    id: "courier",
    label: "Couriers",
    title: "A phone-first task list for the road.",
    points: [
      "Active pickups and deliveries, newest first",
      "Tap to call the sender or receiver, open in Maps",
      "Only the next allowed status, so no wrong taps",
      "Take the proof photo with the phone camera",
      "Earnings by day and month, with payout status",
      "Go available or unavailable in one switch",
    ],
    preview: { lazy: "courier" },
  },
  {
    id: "admin",
    label: "Operations",
    title: "Run zones, hubs, couriers and money.",
    points: [
      "Overview of revenue and shipments per day",
      "Assign couriers safely, even with two admins at once",
      "Move parcels through the hubs step by step",
      "Zones, hubs and pricing rules in pounds and dollars",
      "Payments with refund retry when one is stuck",
      "Audit log with filters and CSV export",
    ],
    preview: { lazy: "admin" },
  },
];

export function Roles() {
  return (
    <Section id="roles" title="One platform, three views" intro="Each account sees what its job needs, and nothing else.">
      <RoleTabs roles={ROLES} />
    </Section>
  );
}

/* ───────────── FAQ ───────────── */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Where do you deliver?",
    a: "Within and between Carrivo’s metro zones. The coverage section above lists every zone and hub, read live from our network.",
  },
  {
    q: "How is the price worked out?",
    a: "Each route and service has a base fee that covers the first pounds, plus a fixed amount for each started pound above that. You see the total before you pay, and it doesn’t change after.",
  },
  {
    q: "When do I pay?",
    a: "After you book and before a pickup is scheduled. Payment runs on Stripe Checkout; your card details go to Stripe, not to us.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, any time before the courier picks the parcel up. If you’ve paid, the payment is refunded to your card. After pickup the parcel is on its way and can’t be cancelled.",
  },
  {
    q: "What if nobody is home?",
    a: "The courier marks the attempt as failed and tries again. After three failed attempts the parcel is returned to you.",
  },
  {
    q: "Is Same day available everywhere?",
    a: "No. Same day is offered only inside one metro zone, on routes that have a same-day price. The price check tells you straight away.",
  },
  {
    q: "Can I change the pickup window?",
    a: "Not once it’s booked, so pick a window when someone can hand the parcel over. Windows are up to 12 hours long, any day in the next 30.",
  },
  {
    q: "How do I reach support?",
    a: (
      <>
        Email <a href={`mailto:${SITE.contactEmail}`} className="font-semibold text-foreground underline underline-offset-4">{SITE.contactEmail}</a> or use
        the <Link href="/contact" className="font-semibold text-foreground underline underline-offset-4">contact page</Link>. We answer{" "}
        {SITE.supportHours.filter((row) => row.hours !== "Closed").map((row) => `${row.days} ${row.hours}`).join(", ")}, {SITE.timeZoneLabel}.
      </>
    ),
  },
];

export function Faq() {
  return (
    <Section id="faq" title="Questions, answered" intro="The short version of how Carrivo works.">
      <div className="rounded-2xl bg-card px-6 shadow-card sm:px-8">
        <Accordion type="single" collapsible>
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ───────────── Final call to action ───────────── */

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="pb-20 sm:pb-24">
      <Container>
        <div
          data-reveal=""
          className="relative isolate grid items-center gap-10 overflow-hidden rounded-panel bg-brand p-8 text-brand-foreground shadow-raised sm:p-12 lg:grid-cols-[1.25fr_1fr] lg:gap-12 lg:p-16"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-white/20 blur-3xl" />
          <div className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 id="cta-heading" className="font-display text-display-2">
                Your first parcel is a few minutes away.
              </h2>
              <p className="text-lg font-medium">Create a free account, get a price, and pay only for what you send.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Magnetic>
                <Button asChild size="lg" className="bg-ink text-ink-foreground hover:bg-ink/90">
                  <Link href="/register">
                    Create an account <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic>
                <Button asChild size="lg" variant="outline" className="border-ink/30 bg-transparent text-brand-foreground hover:bg-ink/10 hover:text-brand-foreground dark:border-ink/30 dark:bg-transparent dark:hover:bg-ink/10">
                  <Link href="/contact">Talk to us</Link>
                </Button>
              </Magnetic>
            </div>
          </div>
          <CtaVan className="mx-auto max-w-sm lg:max-w-none" />
        </div>
      </Container>
    </section>
  );
}
