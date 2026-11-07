import { BUSINESS_TIME_ZONE } from "./format";

/** Short labels so the four pills fit a 375px screen without scrolling ("this week" etc. live in TIME_RANGE_LABELS). */
export const TIME_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];

export const isTimeRange = (value: string | undefined): value is TimeRange =>
  TIME_RANGES.some((range) => range.value === value);

const dhakaParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), weekday: get("weekday") };
};

const ymd = (year: number, month: number, day: number) => {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * `{ fromDate, toDate }` as YYYY-MM-DD Dhaka days, the format every API date filter accepts.
 * Weeks start on Monday. Pass `now` for tests. In a Server Component, `await connection()` first
 * (reading the clock during a prerender is an error under Cache Components); in client components
 * call it from an event handler or effect.
 */
export function timeRangeToDates(range: TimeRange, now: Date = new Date()): { fromDate: string; toDate: string } {
  const { year, month, day, weekday } = dhakaParts(now);
  const today = ymd(year, month, day);
  switch (range) {
    case "today":
      return { fromDate: today, toDate: today };
    case "week": {
      const offset = Math.max(0, WEEKDAYS.indexOf(weekday));
      return { fromDate: ymd(year, month, day - offset), toDate: today };
    }
    case "month":
      return { fromDate: ymd(year, month, 1), toDate: today };
    case "year":
      return { fromDate: ymd(year, 1, 1), toDate: today };
  }
}

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: "today",
  week: "this week",
  month: "this month",
  year: "this year",
};

/**
 * Date filters for the API plus the same Dhaka-day bounds as ISO instants (start 00:00, end 23:59:59.999,
 * UTC+6), for filtering rows the API can't filter by date itself. Same clock rules as above.
 */
export function timeRangeBounds(range: TimeRange, now: Date = new Date()) {
  const { fromDate, toDate } = timeRangeToDates(range, now);
  return { fromDate, toDate, fromIso: `${fromDate}T00:00:00.000+06:00`, toIso: `${toDate}T23:59:59.999+06:00` };
}
