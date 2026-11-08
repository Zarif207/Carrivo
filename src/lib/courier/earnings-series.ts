import type { TrendPoint } from "@/components/charts/area-trend-chart";
import { hourLabel, monthLabel, shortDayLabel } from "@/lib/format";
import { zonedParts } from "@/lib/timezone";
import type { TimeRange } from "@/lib/time-range";
import type { Earning } from "@/types";

/* Pure: buckets earnings into chart points. Pass `now` (Server Components read it after connection()). */

const parts = (date: Date) => {
  const p = zonedParts(date);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour };
};

/**
 * Today → by hour, this week / this month → by day, this year → by month (business time zone).
 * Every bucket from the start of the range up to now is present, so quiet days show as zero.
 */
export function earningsSeries(earnings: Earning[], range: TimeRange, fromDate: string, now: Date): TrendPoint[] {
  const today = parts(now);
  const buckets = new Map<string, TrendPoint>();
  const key = (d: { year: number; month: number; day: number; hour: number }) =>
    range === "today" ? `${d.hour}` : range === "year" ? `${d.year}-${d.month}` : `${d.year}-${d.month}-${d.day}`;

  if (range === "today") {
    for (let h = 0; h <= today.hour; h++) buckets.set(`${h}`, { label: hourLabel(h), value: 0 });
  } else if (range === "year") {
    for (let m = 1; m <= today.month; m++) buckets.set(`${today.year}-${m}`, { label: monthLabel(m), value: 0 });
  } else {
    const [y, m, d] = fromDate.split("-").map(Number);
    for (let cursor = new Date(Date.UTC(y, m - 1, d)); ; cursor = new Date(cursor.getTime() + 86_400_000)) {
      const c = { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1, day: cursor.getUTCDate(), hour: 0 };
      buckets.set(key(c), { label: shortDayLabel(c.month, c.day), value: 0 });
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
