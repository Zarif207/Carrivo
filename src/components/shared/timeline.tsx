import { MapPin, UserRound } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { SHIPMENT_MAIN_PATH, SHIPMENT_STATUS_META, TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import { RelativeTime } from "./relative-time";
import { TERMINAL_STATUSES, type ShipmentStatus, type StatusHistoryEntry, type TrackingEvent } from "@/types";

export interface TimelineEvent {
  id: string;
  status: ShipmentStatus;
  at: string;
  note?: string | null;
  place?: string | null;
  actor?: string | null;
}

interface TimelineProps {
  events: TimelineEvent[];
  /** Show the remaining stops of the normal route, dimmed. */
  showUpcoming?: boolean;
  className?: string;
}

/** Status history (authenticated views): hub + who made the change. */
export function fromStatusHistory(entries: StatusHistoryEntry[]): TimelineEvent[] {
  return entries.map((entry) => ({
    id: entry.id,
    status: entry.toStatus,
    at: entry.createdAt,
    note: entry.note,
    place: entry.hub ? `${entry.hub.name}, ${entry.hub.city}` : null,
    actor: entry.changedBy?.name ?? null,
  }));
}

/** Public tracking: city only, never people. */
export function fromTrackingTimeline(events: TrackingEvent[]): TimelineEvent[] {
  return events.map((event, index) => ({
    id: `${event.status}-${event.at}-${index}`,
    status: event.status,
    at: event.at,
    place: event.city,
  }));
}

function upcomingStops(current: ShipmentStatus): ShipmentStatus[] {
  if ((TERMINAL_STATUSES as readonly ShipmentStatus[]).includes(current)) return [];
  const index = SHIPMENT_MAIN_PATH.indexOf(current === "FAILED_DELIVERY" ? "OUT_FOR_DELIVERY" : current);
  return index === -1 ? [] : SHIPMENT_MAIN_PATH.slice(index + 1);
}

/**
 * The route line: newest stop on top in orange with a pulse (off under reduced motion), past stops below,
 * optional upcoming stops dimmed above it as a dotted line.
 */
export function Timeline({ events, showUpcoming = false, className }: TimelineProps) {
  const sorted = [...events].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const current = sorted[0];
  const upcoming = showUpcoming && current ? upcomingStops(current.status).reverse() : [];

  return (
    <ol className={cn("relative", className)} aria-label="Shipment progress">
      {upcoming.map((status) => {
        const meta = SHIPMENT_STATUS_META[status];
        return (
          <li key={`next-${status}`} className="relative flex gap-4 pb-6">
            <span aria-hidden="true" className="absolute top-6 bottom-0 left-[0.9375rem] border-l-2 border-dotted border-border" />
            <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 border-dashed border-border bg-background text-muted-foreground">
              <meta.icon className="size-3.5" aria-hidden="true" />
            </span>
            <p className="pt-1 text-sm text-muted-foreground">
              <span className="sr-only">Upcoming: </span>
              {meta.label}
            </p>
          </li>
        );
      })}

      {sorted.map((event, index) => {
        const meta = SHIPMENT_STATUS_META[event.status];
        const isCurrent = index === 0;
        const isLast = index === sorted.length - 1;
        return (
          <li key={event.id} className={cn("relative flex gap-4", !isLast && "pb-7")} aria-current={isCurrent ? "step" : undefined}>
            {!isLast ? <span aria-hidden="true" className="absolute top-8 bottom-0 left-[0.9375rem] w-0.5 rounded-full bg-foreground/12" /> : null}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full",
                isCurrent ? "animate-beacon bg-brand text-brand-foreground" : TONE_CLASSES[meta.tone],
              )}
            >
              <meta.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className={cn("font-bold", isCurrent ? "text-lg" : "text-base")}>{meta.label}</p>
                {isCurrent ? (
                  <RelativeTime value={event.at} className="text-sm text-muted-foreground tabular" />
                ) : (
                  <time dateTime={event.at} className="text-sm text-muted-foreground tabular">
                    {formatDateTime(event.at)}
                  </time>
                )}
              </div>
              {event.note ? <p className="text-sm">{event.note}</p> : isCurrent ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
              {event.place || event.actor ? (
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {event.place ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {event.place}
                    </span>
                  ) : null}
                  {event.actor ? (
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="size-3.5" aria-hidden="true" />
                      {event.actor}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
