import { Camera, Package, Truck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CourierRider } from "@/components/home/illustrations/courier-rider";
import { DoorstepPhoto } from "@/components/home/illustrations/doorstep-photo";
import { Container } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { DRIVE_WITH_CARRIVO_PATH } from "@/config/nav";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CampaignChips, CampaignHeadline, CampaignRouteLines } from "./campaign-parts";
import { CourierCta } from "./courier-cta";

/*
 * "Drive with Carrivo" on the home page: a full-width ink band selling the courier side, split into the
 * pitch and a street scene. Server-rendered and complete without JavaScript; GSAP (already lazy-loaded
 * on the home page, components/home/gsap-scenes.tsx) adds the headline reveal, the ride, the floating
 * cards and the flowing route lines, only while the band is on screen and never under reduced motion.
 */

/** viewBox units of the street scene. The courier rides ROUTE from the pickup to the door. */
const W = 520;
const H = 416;
export const CAMPAIGN_STREET_ROUTE = "M58 352 C 150 352 150 262 236 262 C 322 262 326 176 402 176 C 446 176 462 118 466 78";
const PICKUP = { x: 58, y: 352 };
const DOOR = { x: 466, y: 78 };
/** Where the courier rests before the ride starts (on the route), leaning with the road. */
const RIDER = { x: 236, y: 262, angle: 0 };

/** City blocks around the route (decorative). */
const BLOCKS = [
  [20, 24, 120, 84],
  [170, 24, 110, 120],
  [310, 24, 96, 92],
  [20, 140, 92, 150],
  [140, 176, 70, 54],
  [260, 296, 120, 96],
  [404, 236, 96, 156],
  [118, 384, 110, 40],
] as const;

function StreetScene() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <g data-depth="0.4">
        {BLOCKS.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="14" className="fill-white" fillOpacity="0.045" />
        ))}
      </g>
      {/* Road, then the orange route on it */}
      <path d={CAMPAIGN_STREET_ROUTE} fill="none" className="stroke-white" strokeOpacity="0.12" strokeWidth="22" strokeLinecap="round" />
      <path data-street-route="" data-flow="" d={CAMPAIGN_STREET_ROUTE} fill="none" className="stroke-brand" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 18" />
      {/* Pickup and the receiver's door */}
      <circle cx={PICKUP.x} cy={PICKUP.y} r="11" className="fill-ink stroke-brand" strokeWidth="4" />
      <circle cx={PICKUP.x} cy={PICKUP.y} r="4" className="fill-brand" />
      <g transform={`translate(${DOOR.x} ${DOOR.y})`}>
        <path d="M-16 4 L0 -12 L16 4 V22 H-16 Z" className="fill-ink-foreground" />
        <rect x="-5" y="8" width="10" height="14" rx="2" className="fill-brand" />
      </g>
      <g data-campaign-rider="" transform={`translate(${RIDER.x} ${RIDER.y}) rotate(${RIDER.angle})`}>
        <g transform="scale(1.35)">
          <CourierRider />
        </g>
      </g>
    </svg>
  );
}

/** A floating status card over the scene. Real status names from the shipment timeline. */
function ParcelCard({
  icon,
  title,
  detail,
  depth,
  className,
  children,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  depth: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-float=""
      data-depth={depth}
      className={cn("absolute w-max max-w-[11.5rem] rounded-xl bg-ink-foreground p-2.5 pr-3.5 text-ink shadow-overlay sm:max-w-[13rem]", className)}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground [&_svg]:size-4">{icon}</span>
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-bold">{title}</span>
          <span className="block text-xs text-ink/65">{detail}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

export function DriveWithCarrivoSection() {
  return (
    <section
      id="drive"
      aria-labelledby="drive-heading"
      data-campaign=""
      className="campaign relative isolate overflow-hidden bg-ink py-20 text-ink-foreground sm:py-24 lg:py-28"
    >
      <CampaignRouteLines />
      <div aria-hidden="true" data-glow="" className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[38rem] rounded-full bg-brand/30 blur-3xl" />

      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.08fr] lg:gap-16">
        <div className="space-y-8">
          <div className="space-y-5">
            <CampaignHeadline as="h2" id="drive-heading" mode="scroll" className="lg:text-[4.25rem]" />
            <p className="max-w-xl text-lg text-sidebar-muted sm:text-xl">
              Deliver parcels in the metro zone you know, on the days that suit you. Carrivo customers can apply in about two minutes, and an admin
              reviews every application.
            </p>
          </div>
          <CampaignChips tone="ink" />
          <CourierCta
            tone="ink"
            secondary={
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/25 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground sm:w-auto dark:border-white/25 dark:bg-transparent dark:hover:bg-white/10"
              >
                <Link href={DRIVE_WITH_CARRIVO_PATH}>Learn more</Link>
              </Button>
            }
          />
        </div>

        <figure className="relative">
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-panel bg-white/[0.035] ring-1 ring-white/10">
            <StreetScene />
            <ParcelCard icon={<Package />} title={SHIPMENT_STATUS_META.PICKED_UP.label} detail="At the sender's door" depth={0.9} className="top-[58%] left-[4%]" />
            <ParcelCard icon={<Truck />} title={SHIPMENT_STATUS_META.OUT_FOR_DELIVERY.label} detail="Your next stop" depth={1.3} className="top-[6%] left-[5%]" />
            <ParcelCard
              icon={<Camera />}
              title={SHIPMENT_STATUS_META.DELIVERED.label}
              detail="Hand-over photo added"
              depth={1.7}
              className="right-[4%] bottom-[5%] hidden sm:block"
            >
              <DoorstepPhoto className="mt-2.5 w-40 overflow-hidden rounded-lg" />
            </ParcelCard>
          </div>
          <figcaption className="sr-only">
            Illustration: a courier on a scooter rides from a pickup to the receiver&rsquo;s door, past cards showing Picked up, Out for delivery and
            Delivered with a hand-over photo.
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
