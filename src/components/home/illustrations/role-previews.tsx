import type { ReactNode } from "react";
import { Camera, CircleDollarSign, CreditCard, LayoutDashboard, MapPin, Package, Phone, Truck, Users } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PREVIEW_SHIPMENTS } from "@/content/preview";
import { formatMoney } from "@/lib/format";
import { COURIER_ACTIONS, type CourierTarget } from "@/lib/courier/actions";
import { cn } from "@/lib/utils";
import type { ShipmentStatus } from "@/types";
import { PhoneFrame } from "./frames";

/*
 * Mini screens of the courier app and the admin overview for the role tabs, built from the real
 * components (StatusBadge, StatCard) with the sample shipments from content/preview.ts. Pictures
 * of the product, not live data: the captions say so.
 */

const OUT = PREVIEW_SHIPMENTS.find((s) => s.status === "OUT_FOR_DELIVERY") ?? PREVIEW_SHIPMENTS[0];
const PICKUP = PREVIEW_SHIPMENTS[0];

const TASKS: { id: string; status: ShipmentStatus; next: CourierTarget; kind: string; name: string; address: string; photo?: boolean }[] = [
  { id: "t1", status: "COURIER_ASSIGNED", next: "PICKED_UP", kind: "Pickup from", name: PICKUP.senderName, address: PICKUP.pickupAddress },
  { id: "t2", status: OUT.status, next: "DELIVERED", kind: "Deliver to", name: OUT.receiverName, address: OUT.deliveryAddress, photo: true },
];

function Pill({ children, tone = "outline" }: { children: ReactNode; tone?: "outline" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold [&_svg]:size-3.5",
        tone === "brand" ? "bg-brand text-brand-foreground" : "ring-1 ring-input",
      )}
    >
      {children}
    </span>
  );
}

export function CourierPreview({ className }: { className?: string }) {
  return (
    <PhoneFrame className={className} caption="The courier app, shown with sample tasks.">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Courier</p>
          <p className="text-lg font-extrabold tracking-tight">Active tasks</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold">
          Available
          <span className="flex h-5 w-9 items-center justify-end rounded-full bg-brand p-0.5" aria-hidden="true">
            <span className="size-4 rounded-full bg-card" />
          </span>
        </span>
      </div>
      <ul className="space-y-3">
        {TASKS.map((task) => (
          <li key={task.id} className="space-y-2.5 rounded-xl bg-card p-3 shadow-card">
            <StatusBadge kind="shipment" status={task.status} size="sm" />
            <div className="space-y-0.5 text-sm">
              <p className="text-xs text-muted-foreground">{task.kind}</p>
              <p className="font-semibold">{task.name}</p>
              <p className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                {task.address}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill>
                <Phone aria-hidden="true" /> Call
              </Pill>
              {task.photo ? (
                <Pill>
                  <Camera aria-hidden="true" /> Photo
                </Pill>
              ) : null}
              <Pill tone="brand">{COURIER_ACTIONS[task.next].label}</Pill>
            </div>
          </li>
        ))}
      </ul>
    </PhoneFrame>
  );
}

/** Sample shipments booked per day, for the mini area chart. */
const PER_DAY = [3, 4, 2, 5, 4, 6, 5, 7, 6, 8, 7, 6, 9, 8];

function MiniAreaChart() {
  const w = 280;
  const h = 84;
  const max = Math.max(...PER_DAY);
  const step = w / (PER_DAY.length - 1);
  const points = PER_DAY.map((v, i) => [i * step, h - 6 - (v / max) * (h - 16)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="carrivo-mini-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand)", stopOpacity: 0.32 }} />
          <stop offset="1" style={{ stopColor: "var(--brand)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {[0.33, 0.66].map((f) => (
        <path key={f} d={`M0 ${h * f} H${w}`} className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#carrivo-mini-area)" />
      <path d={line} fill="none" className="stroke-brand" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const ADMIN_NAV = [LayoutDashboard, Package, Users, CreditCard];

export function AdminPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <div inert className="rounded-[2rem] bg-ink p-2 shadow-overlay sm:p-2.5">
        <div className="flex gap-2.5">
          <div className="hidden w-14 shrink-0 flex-col items-center gap-2 py-3 sm:flex" aria-hidden="true">
            <LogoMark className="mb-3 size-8" />
            {ADMIN_NAV.map((Icon, i) => (
              <span
                key={i}
                className={cn(
                  "grid size-10 place-items-center rounded-full text-sidebar-muted",
                  i === 0 && "bg-sidebar-accent text-sidebar-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
                )}
              >
                <Icon className="size-[1.125rem]" />
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-4 rounded-[1.5rem] bg-background p-4 text-foreground sm:p-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Operations</p>
              <p className="text-xl font-extrabold tracking-tight">Overview</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <StatCard variant="feature" label="Net revenue" value={formatMoney("1284.50")} icon={CircleDollarSign} hint="After refunds" size="compact" />
              <StatCard label="Shipments" value="48" icon={Package} hint="9 delivered" size="compact" />
              <StatCard label="Active couriers" value="6" icon={Truck} hint="2 zones" size="compact" className="hidden lg:flex" />
            </div>
            <div className="space-y-2 rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-bold">Shipments booked per day</p>
                <p className="text-xs text-muted-foreground">14 days</p>
              </div>
              <MiniAreaChart />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">The admin overview, shown with sample figures.</figcaption>
    </figure>
  );
}
