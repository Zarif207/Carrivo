import { Camera, Search } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline, type TimelineEvent } from "@/components/shared/timeline";
import { PREVIEW_SHIPMENTS } from "@/content/preview";
import { formatTime } from "@/lib/format";
import { DoorstepPhoto } from "./doorstep-photo";
import { PhoneFrame } from "./frames";

/* The delivered sample shipment, as the public tracking page shows it (cities only, never people). */
const SAMPLE = PREVIEW_SHIPMENTS.find((s) => s.status === "DELIVERED") ?? PREVIEW_SHIPMENTS[0];
const CITY = SAMPLE.destinationHub?.city ?? SAMPLE.destinationZone.name;
const at = (minutesBefore: number) => new Date(Date.parse(SAMPLE.updatedAt) - minutesBefore * 60_000).toISOString();

const EVENTS: TimelineEvent[] = [
  { id: "d", status: "DELIVERED", at: at(0), place: CITY },
  { id: "o", status: "OUT_FOR_DELIVERY", at: at(95), place: CITY },
  { id: "h", status: "AT_DESTINATION_HUB", at: at(260), place: CITY },
];

/**
 * A phone showing the real tracking UI (StatusBadge, Timeline) for a sample delivered parcel, with
 * its hand-over photo. The screen is inert (nothing inside can be focused); the caption describes it.
 */
export function TrackingPhone({ className }: { className?: string }) {
  return (
    <PhoneFrame className={className} caption={<>A sample delivered parcel on the tracking page, with the courier&rsquo;s hand-over photo.</>}>
      <div className="flex items-center gap-2.5">
        <LogoMark className="size-7" />
        <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-card px-3 text-sm shadow-card">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-id font-semibold">{SAMPLE.trackingId}</span>
        </span>
      </div>

      <div className="space-y-3 rounded-xl bg-card p-3 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold">Proof of delivery</p>
          <StatusBadge kind="shipment" status="DELIVERED" size="sm" />
        </div>
        <DoorstepPhoto className="overflow-hidden rounded-lg" />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Camera className="size-3.5" aria-hidden="true" />
          Photo added at hand-over, {formatTime(SAMPLE.updatedAt)}
        </p>
      </div>

      <div className="rounded-xl bg-card p-3 text-sm shadow-card [&_li]:pb-4 [&_li:last-child]:pb-0">
        <Timeline events={EVENTS} />
      </div>
    </PhoneFrame>
  );
}
