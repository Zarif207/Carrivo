/*
 * The business time zone: every date filter, pickup window, chart bucket and displayed date uses it,
 * so the server and the browser produce identical text and the API gets the days it expects.
 * Set once here; NEXT_PUBLIC_BUSINESS_TIME_ZONE can override it (it must match the API's zone).
 * Plain module with no imports (runs under `node --test`). DST-aware: offsets are computed per date.
 */

export const BUSINESS_TIME_ZONE: string = process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE || "America/New_York";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** "Mon" … "Sun" */
  weekday: string;
}

/** Wall-clock parts of `date` in the business zone. */
export function zonedParts(date: Date): ZonedParts {
  const p: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) p[part.type] = part.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    second: Number(p.second),
    weekday: p.weekday ?? "",
  };
}

/** Milliseconds to add to UTC to get the zone's wall clock at `instant` (e.g. -5 h in New York winter). */
export function zoneOffsetMs(instant: number): number {
  const p = zonedParts(new Date(instant));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant of a wall-clock time in the business zone, e.g. ("2026-11-10", "10:00").
 * A time skipped by the spring-forward jump resolves to just after it; a repeated fall-back time to
 * its first occurrence (same rule as the API).
 */
export function zonedTimeToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm, ss);
  const first = wall - zoneOffsetMs(wall);
  return new Date(wall - zoneOffsetMs(first));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "+HH:MM" / "-HH:MM" for an offset in milliseconds. */
export function formatOffset(offsetMs: number): string {
  const total = Math.round(offsetMs / 60_000);
  const sign = total < 0 ? "-" : "+";
  const abs = Math.abs(total);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** "2026-11-10T10:00:00-05:00": a wall-clock time in the business zone, with that date's offset. */
export function zonedIso(date: string, time: string): string {
  const instant = zonedTimeToUtc(date, time).getTime();
  const p = zonedParts(new Date(instant));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${formatOffset(zoneOffsetMs(instant))}`;
}

/** YYYY-MM-DD of `date` in the business zone. */
export function zonedDay(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** YYYY-MM-DD of the business-zone day `offset` days after `now`'s day (calendar days, DST-safe). */
export function zonedDayFrom(now: Date, offset: number): string {
  const p = zonedParts(now);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + offset));
  return d.toISOString().slice(0, 10);
}
