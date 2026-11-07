import type { TrendPoint } from "@/components/charts/area-trend-chart";
import { BUSINESS_TIME_ZONE } from "@/lib/format";
import type { TimeRange } from "@/lib/time-range";
import type { Earning } from "@/types";

/* Pure: buckets earnings into chart points. Pass `now` (Server Components read it after connection()). */

const parts = (date: Date) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Today → by hour, this week / this month → by day, this year → by month (Dhaka time).
 * Every bucket from the start of the range up to now is present, so quiet days show as zero.
 */
export function earningsSeries(earnings: Earning[], range: TimeRange, fromDate: string, now: Date): TrendPoint[] {
  const today = parts(now);
  const buckets = new Map<string, TrendPoint>();
  const key = (d: { year: number; month: number; day: number; hour: number }) =>
    range === "today" ? `${d.hour}` : range === "year" ? `${d.year}-${d.month}` : `${d.year}-${d.month}-${d.day}`;

  if (range === "today") {
    for (let h = 0; h <= today.hour; h++) buckets.set(`${h}`, { label: `${String(h).padStart(2, "0")}:00`, value: 0 });
  } else if (range === "year") {
    for (let m = 1; m <= today.month; m++) buckets.set(`${today.year}-${m}`, { label: MONTHS[m - 1], value: 0 });
  } else {
    const [y, m, d] = fromDate.split("-").map(Number);
    for (let cursor = new Date(Date.UTC(y, m - 1, d)); ; cursor = new Date(cursor.getTime() + 86_400_000)) {
      const c = { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1, day: cursor.getUTCDate(), hour: 0 };
      buckets.set(key(c), { label: `${c.day} ${MONTHS[c.month - 1]}`, value: 0 });
      if (c.year === today.year && c.month === today.month && c.day === today.day) break;
      if (buckets.size > 31) break; // safety
    }
  }

  for (const earning of earnings) {
    const bucket = buckets.get(key(parts(new Date(earning.createdAt))));
    if (bucket) bucket.value = Math.round((bucket.value + Number(earning.amount)) * 100) / 100;
  }
  return [...buckets.values()];
}
