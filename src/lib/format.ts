import { formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { BUSINESS_TIME_ZONE } from "@/lib/timezone";
import type { DecimalString, ISODateString, Money } from "@/types";

export { BUSINESS_TIME_ZONE } from "@/lib/timezone";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** "6.00" → "$6.00". The API sends dollars as strings; never cents. */
export function formatMoney(value: Money | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? usd.format(amount) : "—";
}

/** "5.5" → "5.5 lb" (weights are pounds) */
export function formatWeight(value: DecimalString | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const lb = typeof value === "number" ? value : Number(value);
  return Number.isFinite(lb) ? `${lb.toLocaleString("en-US", { maximumFractionDigits: 2 })} lb` : "—";
}

const toDate = (value: ISODateString | Date): Date | null => {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
};

/*
 * All dates render in the business time zone (BUSINESS_TIME_ZONE, America/New_York like the API's
 * date filters) in US formats, so the server and the browser produce identical text: no hydration
 * mismatches, no UTC surprises.
 */
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: BUSINESS_TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: BUSINESS_TIME_ZONE,
});
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: BUSINESS_TIME_ZONE });
const zoneNameFormat = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TIME_ZONE, timeZoneName: "longGeneric" });

/** "Eastern Time": the business time zone's everyday name, for labels such as "Times are Eastern Time". */
export const BUSINESS_TIME_ZONE_NAME: string =
  zoneNameFormat.formatToParts(new Date(Date.UTC(2026, 0, 1))).find((part) => part.type === "timeZoneName")?.value ?? BUSINESS_TIME_ZONE;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Chart axis label for a calendar day: (11, 7) → "Nov 7". */
export const shortDayLabel = (month: number, day: number): string => `${MONTHS_SHORT[month - 1]} ${day}`;

/** Chart axis label for an hour of the day: 0 → "12 AM", 13 → "1 PM". */
export const hourLabel = (hour: number): string => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;

export const monthLabel = (month: number): string => MONTHS_SHORT[month - 1];

/** 11/06/2026 */
export function formatDate(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? dateFormat.format(date) : "—";
}

/** 11/06/2026, 10:49 AM (business time zone) */
export function formatDateTime(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? dateTimeFormat.format(date) : "—";
}

/** 10:49 AM (business time zone) */
export function formatTime(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? timeFormat.format(date) : "—";
}

/** "3 hours ago" */
export function formatRelative(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : "—";
}

/** "Emily Carter" → "EC" */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

/** 1234 → "1,234" */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
