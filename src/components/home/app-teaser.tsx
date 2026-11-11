import { Bell, Bike, Camera, Smartphone, TabletSmartphone } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/public/section";
import { LogoMark } from "@/components/shared/logo";
import { EXAMPLE_TRACKING_ID } from "@/config/site";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { DoorstepPhoto } from "./illustrations/doorstep-photo";

/*
 * "Mobile app, coming soon" teaser at the foot of the home page (server component). Light warm tint
 * in light mode, a dark surface in dark mode: the page already has two ink bands.
 *
 * The phone shows a tracking screen drawn in code with the real status names and brand tokens. The
 * HTML is its finished state (Delivered, pin at the door, both alerts shown): that is what visitors
 * without JavaScript and with reduced motion see. GSAP (components/home/app-teaser-motion.ts, inside the
 * home page's lazily loaded chunk) loops it only while it is on screen. The phone box has a fixed
 * size, so nothing shifts.
 */

const STEPS = ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const LAST = STEPS.length - 1;

const PLANNED = ["Live parcel tracking", "Push alerts for each status change", "Hand-over photo in your pocket"];

/** The mini route on the phone (viewBox units); the pin rides it as the steps advance. */
export const APP_ROUTE = "M14 52 C 46 52 52 18 92 22 C 128 26 128 50 160 46 C 178 44 186 30 190 24";

function StoreButton({ icon, store }: { icon: ReactNode; store: string }) {
  return (
    // Not a link and not focusable (native disabled): there is nothing to download yet.
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={`${store}: coming soon`}
      className="inline-flex h-12 cursor-not-allowed items-center gap-2.5 rounded-full border border-dashed border-input bg-transparent pr-5 pl-4 text-left text-muted-foreground [&_svg]:size-5"
    >
      {icon}
      <span className="leading-tight">
        <span className="block text-xs">Coming soon</span>
        <span className="block text-sm font-semibold">{store}</span>
      </span>
    </button>
  );
}

function Toast({ icon, title, detail, className }: { icon: ReactNode; title: string; detail: string; className?: string }) {
  return (
    <div data-app-toast="" className={cn("absolute z-20 flex w-max items-center gap-2.5 rounded-xl bg-card p-2.5 pr-3.5 text-card-foreground shadow-overlay ring-1 ring-border", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground [&_svg]:size-4">{icon}</span>
      <span className="leading-tight">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </div>
  );
}

/** The front phone's tracking screen (decorative; sizes in em so it scales with the phone). */
function TrackingScreen() {
  return (
    <div className="flex h-full flex-col gap-[1.15em] bg-background px-[1em] pt-[2.8em] pb-[1.2em] text-foreground">
      <div className="flex items-center gap-[0.6em]">
        <LogoMark className="size-[2em]" />
        <span className="font-display text-[1.15em] font-extrabold tracking-tight">Carrivo</span>
        <Bell className="ml-auto size-[1.3em] text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="rounded-[0.9em] bg-card p-[0.8em] shadow-card">
        <div className="flex items-center justify-between gap-[0.5em]">
          <span className="truncate font-id text-[0.85em] font-semibold">{EXAMPLE_TRACKING_ID}</span>
          <span data-app-status="" className="shrink-0 rounded-full bg-secondary px-[0.6em] py-[0.2em] text-[0.75em] font-bold text-foreground">
            {SHIPMENT_STATUS_META.DELIVERED.label}
          </span>
        </div>
        <svg viewBox="0 0 204 64" className="mt-[0.6em] block h-auto w-full" aria-hidden="true" focusable="false">
          <path d={APP_ROUTE} fill="none" className="stroke-foreground" strokeOpacity="0.1" strokeWidth="8" strokeLinecap="round" />
          <path data-app-route="" d={APP_ROUTE} fill="none" className="stroke-brand" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" />
          <circle cx="14" cy="52" r="4.5" className="fill-card stroke-brand" strokeWidth="2.5" />
          <path d="M183 26 L190 19 L197 26 V33 H183 Z" className="fill-foreground" />
          {/* The parcel pin, resting at the door (the finished state). */}
          <g data-app-pin="" transform="translate(190 24)">
            <path d="M0 0 C -7 -8 -9 -12 -9 -16 A 9 9 0 0 1 9 -16 C 9 -12 7 -8 0 0 Z" className="fill-brand" />
            <rect x="-4" y="-20" width="8" height="8" rx="1.5" className="fill-brand-foreground" />
          </g>
        </svg>
      </div>

      <ol className="space-y-[0.85em] rounded-[0.9em] bg-card p-[0.9em] shadow-card">
        {STEPS.map((status, i) => (
          <li
            key={status}
            data-app-step=""
            data-label={SHIPMENT_STATUS_META[status].label}
            data-state={i === LAST ? "current" : "done"}
            className="group flex items-center gap-[0.6em] text-[0.85em] text-muted-foreground data-[state=current]:font-bold data-[state=current]:text-foreground data-[state=done]:text-foreground"
          >
            <span className="size-[0.7em] shrink-0 rounded-full border-2 border-input group-data-[state=current]:border-brand group-data-[state=current]:bg-brand group-data-[state=current]:shadow-[0_0_0_0.3em] group-data-[state=current]:shadow-brand/25 group-data-[state=done]:border-foreground group-data-[state=done]:bg-foreground" />
            {SHIPMENT_STATUS_META[status].label}
          </li>
        ))}
      </ol>

      <div data-app-photo="" className="flex items-center gap-[0.7em] rounded-[0.9em] bg-card p-[0.6em] shadow-card">
        <DoorstepPhoto className="w-[6em] shrink-0 overflow-hidden rounded-[0.5em]" />
        <span className="text-[0.8em] leading-tight">
          <span className="block font-bold">Hand-over photo</span>
          <span className="text-muted-foreground">Added by your courier</span>
        </span>
      </div>
    </div>
  );
}

/** The back phone: a quieter list of alerts, for depth. */
function AlertsScreen() {
  return (
    <div className="flex h-full flex-col gap-[0.7em] bg-background px-[0.9em] pt-[2.4em] text-foreground">
      <span className="font-display text-[1.05em] font-extrabold">Alerts</span>
      {(["OUT_FOR_DELIVERY", "AT_DESTINATION_HUB", "IN_TRANSIT", "PICKED_UP"] as const).map((status) => (
        <span key={status} className="flex items-center gap-[0.5em] rounded-[0.8em] bg-card p-[0.6em] text-[0.8em] font-semibold shadow-card">
          <span className="size-[0.6em] rounded-full bg-brand" />
          {SHIPMENT_STATUS_META[status].label}
        </span>
      ))}
    </div>
  );
}

function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative aspect-[9/19] rounded-[2.4em] bg-ink p-[0.45em] shadow-overlay", className)}>
      <span className="absolute top-[0.95em] left-1/2 z-10 h-[0.45em] w-[4em] -translate-x-1/2 rounded-full bg-ink-foreground/25" />
      <div className="h-full overflow-hidden rounded-[2em]">{children}</div>
    </div>
  );
}

export function AppTeaser() {
  return (
    <section id="app" aria-labelledby="app-heading" className="pb-20 sm:pb-24">
      <Container>
        <div
          data-app-teaser=""
          className="relative isolate grid items-center gap-8 overflow-hidden rounded-panel bg-brand-soft/70 px-6 py-10 ring-1 ring-brand/15 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-8 lg:pl-14 dark:bg-card dark:ring-white/8"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl dark:bg-brand/15" />

          <div className="space-y-6">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-sm font-bold text-brand-foreground">
                <Smartphone className="size-4" aria-hidden="true" />
                Coming soon
              </span>
              <h2 id="app-heading" className="max-w-lg font-display text-display-2">
                <span className="sr-only">Mobile app, coming soon: </span>
                Every parcel, tracked from your pocket.
              </h2>
              <p className="max-w-lg text-lg text-muted-foreground">
                We&rsquo;re building a Carrivo app for iPhone and Android with the same live tracking you get on the web today.
              </p>
            </div>

            <ul aria-label="Planned features" className="flex flex-wrap gap-2">
              {PLANNED.map((feature) => (
                <li key={feature} className="rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-card-foreground shadow-card ring-1 ring-border">
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <StoreButton icon={<Smartphone aria-hidden="true" />} store="App Store" />
              <StoreButton icon={<TabletSmartphone aria-hidden="true" />} store="Google Play" />
            </div>
            {/*
              Waitlist (not built): a "Notify me" control would go here, under the store buttons. It needs
              an email endpoint and consent copy first; there is no backend for it yet.
            */}
          </div>

          {/* Decorative mockup with a fixed box (no layout shift); the text alternative is the figcaption. */}
          <figure className="relative mx-auto h-[25rem] w-full max-w-[22rem] sm:h-[31rem] lg:max-w-[24rem]">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute top-12 left-[2%] w-[9rem] -rotate-[8deg] text-[9px] opacity-90 sm:top-14 sm:left-[6%] sm:w-[11rem] sm:text-[10px]">
                <Phone>
                  <AlertsScreen />
                </Phone>
              </div>
              <div data-app-tilt="" className="absolute top-2 right-[4%] w-[11.25rem] text-[9.5px] sm:right-[8%] sm:w-[14rem] sm:text-[11.5px]">
                <div data-app-phone="">
                  <Phone>
                    <TrackingScreen />
                  </Phone>
                </div>
              </div>
              <Toast icon={<Bike />} title={SHIPMENT_STATUS_META.OUT_FOR_DELIVERY.label} detail="Your parcel is on its way" className="top-[22%] left-0" />
              <Toast icon={<Camera />} title="Delivered with photo" detail="See the hand-over" className="right-0 bottom-[4%]" />
            </div>
            <figcaption className="sr-only">
              Illustration of the planned app: a phone tracking a parcel from Booked to Delivered on a small route map, with alerts for Out for
              delivery and Delivered with photo.
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
