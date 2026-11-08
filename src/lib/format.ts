import { formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import type { DecimalString, ISODateString, Money } from "@/types";

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

/**
 * All dates render in the business timezone (Asia/Dhaka, like the API's date filters), so the
 * server and the browser produce identical text: no hydration mismatches, no UTC surprises.
 */
export const BUSINESS_TIME_ZONE = "Asia/Dhaka";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: BUSINESS_TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: BUSINESS_TIME_ZONE,
});

/** 6 Nov 2026 */
export function formatDate(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? dateFormat.format(date) : "—";
}

/** 6 Nov 2026, 10:49 am (Dhaka time) */
export function formatDateTime(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? dateTimeFormat.format(date) : "—";
}

/** "3 hours ago" */
export function formatRelative(value: ISODateString | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : "—";
}

/** "Ayesha Rahman" → "AR" */
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
