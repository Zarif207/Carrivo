import { BadgeCheck, CalendarDays, Camera, Check, ChevronDown, MapPinned, ShieldOff, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CourierRider } from "@/components/home/illustrations/courier-rider";
import { CtaVan } from "@/components/home/illustrations/cta-van";
import { Container, Section } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { SHIPMENT_STATUS_META, VEHICLE_NAMES } from "@/lib/status";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES } from "@/types";
import { CampaignChips, CampaignHeadline, CampaignRouteLines } from "./campaign-parts";
import { CourierCta } from "./courier-cta";

/*
 * /drive-with-carrivo, the courier campaign's long page. Server components only: every word and link
 * is in the HTML (JavaScript off included). GSAP (drive-scenes.tsx, loaded at idle) moves the
 * panorama and fills the timeline; nothing waits for it.
 */

/** The share of the vehicle list written out in prose ("bicycle, motorcycle, car, van or truck"). */
const VEHICLES_IN_WORDS = (() => {
  const names = VEHICLE_TYPES.map((v) => VEHICLE_NAMES[v].toLowerCase());
  return `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
})();

/* ───────────── Hero ───────────── */

/** viewBox units of the panorama; it is cropped from the sides on narrow screens (slice). */
const PANO_W = 1200;
const PANO_H = 400;
const PANO_ROUTE = "M-40 318 C 180 318 240 236 420 236 C 600 236 640 316 820 316 C 980 316 1040 228 1240 228";
const PANO_STOPS = [
  { x: 420, y: 236, label: "Pickup" },
  { x: 820, y: 316, label: "Hub" },
] as const;

/** A skyline: [x, width, height] per building, standing on the ground line. */
const FAR_SKYLINE = [
  [20, 90, 150], [130, 70, 210], [215, 110, 130], [345, 80, 240], [440, 120, 170], [585, 70, 220],
  [670, 130, 150], [820, 80, 230], [920, 110, 170], [1050, 70, 250], [1130, 90, 160],
] as const;
const NEAR_SKYLINE = [
  [60, 120, 90], [250, 90, 120], [470, 150, 80], [700, 100, 110], [930, 140, 95], [1110, 100, 120],
] as const;
const GROUND = 300;

function Panorama() {
  return (
    <figure
      data-panorama=""
      className="campaign relative isolate mx-auto aspect-[16/11] w-full max-w-[90rem] overflow-hidden rounded-panel bg-ink text-ink-foreground shadow-overlay sm:aspect-[2/1] lg:aspect-[3/1]"
    >
      <div aria-hidden="true" data-glow="" className="pointer-events-none absolute -top-1/2 left-1/4 -z-10 aspect-square w-[60%] rounded-full bg-brand/30 blur-3xl" />
      <svg viewBox={`0 0 ${PANO_W} ${PANO_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
        <g data-depth="0.5">
          {FAR_SKYLINE.map(([x, w, h]) => (
            <rect key={x} x={x} y={GROUND - h} width={w} height={h + 120} rx="10" className="fill-white" fillOpacity="0.04" />
          ))}
        </g>
        <g data-depth="1.1">
          {NEAR_SKYLINE.map(([x, w, h]) => (
            <rect key={x} x={x} y={GROUND - h + 40} width={w} height={h + 120} rx="10" className="fill-white" fillOpacity="0.065" />
          ))}
        </g>
        <path d={PANO_ROUTE} fill="none" className="stroke-ink" strokeWidth="34" strokeLinecap="round" />
        <path d={PANO_ROUTE} fill="none" className="stroke-white" strokeOpacity="0.14" strokeWidth="26" strokeLinecap="round" />
        <path data-panorama-route="" data-flow="" d={PANO_ROUTE} fill="none" className="stroke-brand" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="6 18" />
        {PANO_STOPS.map((stop) => (
          <g key={stop.label} transform={`translate(${stop.x} ${stop.y})`}>
            <circle r="13" className="fill-ink stroke-brand" strokeWidth="4" />
            <circle r="5" className="fill-brand" />
            <text y="-26" textAnchor="middle" className="fill-ink-foreground text-[20px] font-bold">
              {stop.label}
            </text>
          </g>
        ))}
        {/* Rests on the route between the stops (GSAP takes it from here). */}
        <g data-campaign-rider="" transform="translate(620 276) rotate(20)">
          <g transform="scale(1.9)">
            <CourierRider />
          </g>
        </g>
      </svg>

      <PanoramaCard depth={1.4} className="top-[9%] left-[6%] sm:left-[22%]" title={SHIPMENT_STATUS_META.COURIER_ASSIGNED.label} detail="A pickup in your zone" />
      <PanoramaCard
        depth={1.8}
        className="top-[9%] right-[6%] max-sm:hidden lg:right-[18%]"
        title={SHIPMENT_STATUS_META.DELIVERED.label}
        detail="Hand-over photo added"
        icon={<Camera />}
      />
      <figcaption className="sr-only">Illustration: a Carrivo courier rides past a pickup and a hub across a city skyline.</figcaption>
    </figure>
  );
}

function PanoramaCard({ title, detail, depth, className, icon }: { title: string; detail: string; depth: number; className?: string; icon?: ReactNode }) {
  return (
    <div data-float="" data-depth={depth} className={cn("absolute flex w-max items-center gap-2.5 rounded-xl bg-ink-foreground p-2.5 pr-3.5 text-ink shadow-overlay", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground [&_svg]:size-4">{icon ?? <BadgeCheck />}</span>
      <span className="leading-tight">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-ink/65">{detail}</span>
      </span>
    </div>
  );
}

export function DriveHero() {
  return (
    <section aria-labelledby="drive-hero-heading" className="relative overflow-hidden pt-10 pb-6 sm:pt-14 lg:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 -right-40 size-[40rem] rounded-full bg-brand-soft opacity-70 blur-3xl dark:opacity-30" />
      <Container className="relative space-y-10 lg:space-y-12">
        <CampaignHeadline as="h1" id="drive-hero-heading" mode="css" className="lg:text-[5.25rem] xl:text-[6rem]" />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-16">
          <div className="space-y-6">
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Pick up and deliver parcels in the metro zone you know, on the days that suit you. If you have a Carrivo customer account and a {VEHICLES_IN_WORDS},
              you can apply in about two minutes.
            </p>
            <CampaignChips />
          </div>
          <div data-cta-anchor="" className="lg:pt-1">
            <CourierCta
              secondary={
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="#how-it-works">How it works</Link>
                </Button>
              }
            />
          </div>
        </div>
      </Container>
      <div className="mt-10 px-4 sm:mt-12 sm:px-6 lg:px-8">
        <Panorama />
      </div>
    </section>
  );
}

/* ───────────── Benefits ───────────── */

const BENEFITS = [
  {
    icon: <MapPinned />,
    title: "Choose your zone",
    body: "Pick the metro area you know best when you apply. Once you're approved, you're assigned parcels picked up in your zone.",
  },
  {
    icon: <CalendarDays />,
    title: "Choose your hours",
    body: "Tell us whether you can work weekdays, weekends or full time. As a courier, you switch yourself on or off for new tasks from your dashboard.",
  },
  {
    icon: <Camera />,
    title: "Photo at every hand-over",
    body: "Finish each delivery with a photo. The customer sees it on their shipment page next to the Delivered status.",
  },
  {
    icon: <Wallet />,
    title: "Earnings you can follow",
    body: "Each delivery you complete adds an earning to your courier dashboard, where you can follow your totals by week or month.",
  },
];

export function DriveBenefits() {
  return (
    <Section id="benefits" title="Delivery work that fits your week" intro="What driving with Carrivo looks like, in plain terms.">
      <ul className="grid gap-x-12 sm:grid-cols-2">
        {BENEFITS.map((benefit) => (
          <li key={benefit.title} className="flex gap-5 border-t border-border py-7">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground [&_svg]:size-5" aria-hidden="true">
              {benefit.icon}
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ───────────── How it works ───────────── */

const STEPS = [
  { title: "Apply in about two minutes", body: "Your phone number, vehicle, the days you can work and, if you like, a preferred zone. No licence or Social Security numbers." },
  {
    title: "An admin reviews it",
    body: "You're told in the app and by email when they decide. If it isn't approved, you see the reason and can apply again after 7 days.",
  },
  { title: "Sign in again as a courier", body: "Approval turns your account into a courier account. You're signed out once, then sign back in to your courier dashboard." },
  { title: "Pick up in your zone", body: "Shipments assigned to you appear in your tasks. Update each stop as the parcel moves, so the customer can follow it." },
  { title: "Hand it over with a photo", body: "Mark it delivered and add the hand-over photo. The delivery then shows up in your earnings." },
];

export function DriveTimeline() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="bg-card py-16 sm:py-20 lg:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="space-y-3 lg:sticky lg:top-28 lg:self-start">
          <h2 id="how-it-works-heading" className="font-display text-display-2">
            From application to first delivery
          </h2>
          <p className="text-lg text-muted-foreground">Five steps, and the first one is the only form you fill in.</p>
        </div>
        <ol className="relative space-y-10 pl-16">
          {/* The rail: neutral track, and an orange fill GSAP draws down as you read (full without JS). */}
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[1.375rem] w-0.5 rounded-full bg-border" />
          <span aria-hidden="true" data-timeline-fill="" className="absolute top-2 bottom-2 left-[1.375rem] w-0.5 origin-top rounded-full bg-brand" />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-0 -left-16 grid size-11 place-items-center rounded-full bg-ink font-display text-lg font-bold text-ink-foreground ring-4 ring-card tabular"
              >
                {i + 1}
              </span>
              <h3 className="pt-1.5 text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-2 max-w-xl text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ───────────── What you need ───────────── */

const NEED = [
  "A Carrivo customer account (free to create)",
  "A US phone number we can call about your application",
  `A ${VEHICLES_IN_WORDS}. The number plate is optional, so a bicycle is fine`,
  "Some days you can work: weekdays, weekends or full time",
  "No unfinished shipments of your own when the admin approves you",
];

const NOT_ASKED = ["Driver's licence numbers", "Social Security number", "Any other ID numbers or scans"];

export function DriveRequirements() {
  return (
    <Section id="requirements" title="What you need" intro="A short list, checked by a person, not a background-check form.">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
          <h3 className="text-xl font-bold tracking-tight">To apply</h3>
          <ul className="mt-5 space-y-4">
            {NEED.map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-brand-text" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-ink p-6 text-ink-foreground shadow-card sm:p-8">
          <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ShieldOff className="size-5 text-brand" aria-hidden="true" />
            We won&rsquo;t ask for
          </h3>
          <ul className="mt-5 space-y-4">
            {NOT_ASKED.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-0.5 w-3 shrink-0 rounded-full bg-sidebar-muted" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-sidebar-muted">The form has no fields for them, and please leave them out of your answers.</p>
        </div>
      </div>
    </Section>
  );
}

/* ───────────── FAQ ───────────── */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Who can apply?",
    a: "Anyone with a Carrivo customer account. Admin accounts can't apply, and courier accounts are already couriers.",
  },
  { q: "Do I need a car?", a: `No. You can deliver with a ${VEHICLES_IN_WORDS}. Leave the plate empty if your vehicle has none.` },
  {
    q: "How long does a review take?",
    a: "An admin reads each application, so there's no fixed time. You get a notification in the app and an email as soon as they decide, and your application page always shows where it stands.",
  },
  {
    q: "What if I'm not approved?",
    a: "You see the admin's reason on your application page, and you can apply again 7 days after the decision.",
  },
  { q: "Can I withdraw my application?", a: "Yes, any time while it's pending. You can apply again straight away." },
  {
    q: "What happens to my customer account?",
    a: "It becomes a courier account. An admin can approve you only once your own shipments are delivered or cancelled, and you sign in again afterwards.",
  },
  {
    q: "How do I see what I've earned?",
    a: "Your courier dashboard lists an earning for every delivery you complete, with your totals and a chart for today, this week, this month or this year.",
  },
];

export function DriveFaq() {
  return (
    <Section id="faq" title="Questions from future couriers">
      {/* Native <details>: every answer is in the HTML and opens without JavaScript. */}
      <div className="divide-y divide-border rounded-2xl bg-card px-6 shadow-card sm:px-8">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-left text-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="max-w-3xl pb-5 text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ───────────── Final call to action ───────────── */

export function DriveFinalCta() {
  return (
    <section aria-labelledby="drive-cta-heading" className="pb-20 sm:pb-24">
      <Container>
        <div className="relative isolate grid items-center gap-10 overflow-hidden rounded-panel bg-brand p-8 text-brand-foreground shadow-raised sm:p-12 lg:grid-cols-[1.25fr_1fr] lg:gap-12 lg:p-16">
          <CampaignRouteLines className="opacity-60 mix-blend-multiply" />
          <div className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 id="drive-cta-heading" className="font-display text-display-2">
                Your zone, your days, your first delivery.
              </h2>
              <p className="text-lg font-medium">Apply in about two minutes. An admin reviews it and you hear back in the app and by email.</p>
            </div>
            <div data-cta-anchor="">
              <CourierCta tone="brand" />
            </div>
          </div>
          <CtaVan className="mx-auto max-w-sm lg:max-w-none" />
        </div>
      </Container>
    </section>
  );
}
