import { BUSINESS_TIME_ZONE } from "./format";

export const TIME_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
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
