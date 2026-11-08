import { Building2, CalendarClock, Camera, CheckCircle2, CreditCard, Lock, PackageCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/public/section";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

/*
 * "How it works": the steps are an ordered list (all text, always in the DOM, readable without JS).
 * On large screens with motion allowed, gsap-scenes.tsx pins this section and scrubs through the
 * steps; it only toggles data-active (emphasis and which screen shows), never hides the step text.
 * The screens on the right are decorative illustrations (aria-hidden).
 */

const STEPS = [
  {
    icon: <PackageCheck />,
    title: "Book and see the price",
    body: "Enter both addresses, the weight in pounds and a service. The API prices it before you pay: a base fee plus a fixed amount per extra pound.",
  },
  {
    icon: <CreditCard />,
    title: "Pay by card",
    body: "Checkout runs on Stripe. Your card number goes to Stripe, not to us, and nothing is scheduled until the payment is confirmed.",
  },
  {
    icon: <CalendarClock />,
    title: "Choose a pickup window",
    body: "Pick a window of up to 12 hours, any day in the next 30. A courier from your zone is assigned to collect it.",
  },
  {
    icon: <Truck />,
    title: "Through the hubs",
    body: "Picked up, sorted at the origin hub, in transit, at the destination hub, out for delivery. Every move is a timestamped stop on your tracking page.",
  },
  {
    icon: <Camera />,
    title: "Delivered, with proof",
    body: "The courier can photograph the hand-over. The photo appears on your shipment page, and you get a notification.",
  },
] as const;

function Screen({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div
      data-step-screen={index}
      className={cn(
        "absolute inset-0 flex flex-col justify-center gap-4 p-8 transition-[opacity,transform] duration-500",
        // Without the GSAP scene only the first screen shows; the scene flips data-active per step.
        index === 0 ? "opacity-100" : "translate-y-3 opacity-0",
        "data-[active=true]:translate-y-0 data-[active=true]:opacity-100 data-[active=false]:translate-y-3 data-[active=false]:opacity-0",
      )}
    >
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/6 px-4 py-3 text-sm">
      <span className="text-sidebar-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

const HUB_PATH = ["PICKED_UP", "AT_ORIGIN_HUB", "IN_TRANSIT", "AT_DESTINATION_HUB", "OUT_FOR_DELIVERY"] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="py-16 sm:py-20 lg:py-0">
      <div data-steps-pin="" className="lg:flex lg:min-h-dvh lg:items-center lg:py-20">
        <Container>
          <div className="mb-10 max-w-2xl space-y-3 lg:mb-12">
            <h2 id="how-heading" className="font-display text-display-2">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">Five steps from booking to the receiver&rsquo;s door.</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
            <ol className="space-y-3" data-steps-list="">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  data-step={i}
                  data-reveal=""
                  className="group flex gap-4 rounded-2xl p-4 transition-colors duration-300 data-[active=true]:bg-card data-[active=true]:shadow-card sm:p-5"
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary transition-colors duration-300 group-data-[active=true]:bg-brand group-data-[active=true]:text-brand-foreground [&_svg]:size-5"
                    aria-hidden="true"
                  >
                    {step.icon}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold tracking-tight">
                      <span className="mr-2 text-muted-foreground tabular">{i + 1}.</span>
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Decorative screens, one per step (large screens only). */}
            <div aria-hidden="true" className="relative hidden aspect-[5/4] overflow-hidden rounded-panel bg-ink text-ink-foreground shadow-overlay lg:block">
              <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-brand/20 blur-3xl" />
              <Screen index={0}>
                <p className="text-sm font-semibold text-sidebar-muted">New shipment</p>
                <Line label="From" value="New York Metro" />
                <Line label="To" value="Los Angeles Metro" />
                <Line label="Weight" value="5.5 lb" />
                <Line label="Service" value="Standard" />
                <p className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground">Price shown here before you pay</p>
              </Screen>
              <Screen index={1}>
                <p className="text-sm font-semibold text-sidebar-muted">Checkout</p>
                <div className="space-y-3 rounded-2xl bg-white p-5 text-ink">
                  <p className="flex items-center gap-2 font-bold">
                    <Lock className="size-4" /> Secure card payment
                  </p>
                  <div className="h-10 rounded-lg border border-black/15" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 rounded-lg border border-black/15" />
                    <div className="h-10 rounded-lg border border-black/15" />
                  </div>
                  <div className="h-11 rounded-full bg-ink" />
                </div>
                <p className="text-sm text-sidebar-muted">Hosted by Stripe. Card details never reach Carrivo.</p>
              </Screen>
              <Screen index={2}>
                <p className="text-sm font-semibold text-sidebar-muted">Pickup window</p>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  {["Mon", "Tue", "Wed"].map((day, i) => (
                    <span key={day} className={cn("rounded-xl px-3 py-4 font-bold", i === 1 ? "bg-brand text-brand-foreground" : "bg-white/6")}>
                      {day}
                    </span>
                  ))}
                </div>
                <Line label="From" value="10:00 am ET" />
                <Line label="Until" value="2:00 pm ET" />
              </Screen>
              <Screen index={3}>
                <p className="text-sm font-semibold text-sidebar-muted">Tracking</p>
                <ol className="space-y-2">
                  {HUB_PATH.map((status, i) => (
                    <li key={status} className="flex items-center gap-3 rounded-xl bg-white/6 px-4 py-2.5 text-sm">
                      {i < 2 ? <CheckCircle2 className="size-4 text-brand" /> : <Building2 className={cn("size-4", i === 2 ? "text-brand" : "text-sidebar-muted")} />}
                      <span className={cn("font-semibold", i > 2 && "text-sidebar-muted")}>{SHIPMENT_STATUS_META[status].label}</span>
                      {i === 2 ? <span className="ml-auto size-2 animate-pulse rounded-full bg-brand" /> : null}
                    </li>
                  ))}
                </ol>
              </Screen>
              <Screen index={4}>
                <p className="text-sm font-semibold text-sidebar-muted">Delivered</p>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand/25 to-white/5">
                  <div className="absolute bottom-6 left-1/2 h-24 w-32 -translate-x-1/2 rounded-lg bg-brand/80 shadow-lg" />
                  <div className="absolute bottom-6 left-1/2 h-24 w-3 -translate-x-1/2 bg-white/35" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold">
                    <Camera className="size-3.5" /> Proof of delivery
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 text-brand" /> {SHIPMENT_STATUS_META.DELIVERED.label}
                </p>
              </Screen>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
