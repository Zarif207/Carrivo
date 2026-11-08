import { zonedParts, zonedTimeToUtc } from "./timezone";

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

const ymd = (year: number, month: number, day: number) => {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * `{ fromDate, toDate }` as YYYY-MM-DD days in the business time zone (America/New_York), the format
 * every API date filter accepts.
 * Weeks start on Monday. Pass `now` for tests. In a Server Component, `await connection()` first
 * (reading the clock during a prerender is an error under Cache Components); in client components
 * call it from an event handler or effect.
 */
export function timeRangeToDates(range: TimeRange, now: Date = new Date()): { fromDate: string; toDate: string } {
  const { year, month, day, weekday } = zonedParts(now);
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
 * Date filters for the API plus the same business-day bounds as ISO instants (start 00:00, end
 * 23:59:59.999 in the business time zone, daylight saving included), for filtering rows the API
 * can't filter by date itself. Same clock rules as above.
 */
export function timeRangeBounds(range: TimeRange, now: Date = new Date()) {
  const { fromDate, toDate } = timeRangeToDates(range, now);
  const [y, m, d] = toDate.split("-").map(Number);
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const fromIso = zonedTimeToUtc(fromDate, "00:00").toISOString();
  const toIso = new Date(zonedTimeToUtc(nextDay, "00:00").getTime() - 1).toISOString();
  return { fromDate, toDate, fromIso, toIso };
}
