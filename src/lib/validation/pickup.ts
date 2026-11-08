import { z } from "zod";
import { zonedIso } from "@/lib/timezone";
import { usAddress, usPhone } from "./us";

/*
 * POST /shipments/:id/pickup (contract §5). The API wants ISO date-times with an offset; the form takes a
 * day plus start/end times in the business time zone (America/New_York) and builds e.g.
 * `2026-11-10T10:00:00-05:00`, with that date's own offset (daylight saving included). Rules mirror
 * the API: start in the future and within 30 days, end after start, window at most 12 hours.
 */

export const PICKUP_MAX_DAYS_AHEAD = 30;
export const PICKUP_MAX_WINDOW_HOURS = 12;
const HOUR = 3_600_000;

/** Wall-clock day and time in the business time zone → ISO date-time with that day's offset. */
export const toBusinessIso = (date: string, time: string) => zonedIso(date, time);

/** `now` is passed in (the form calls it at submit time) so the rules stay pure. */
export const pickupSchema = (now: number) =>
  z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day"),
      start: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
      end: z.string().regex(/^\d{2}:\d{2}$/, "Pick an end time"),
      pickupAddress: usAddress,
      contactName: z.string().trim().min(2, "At least 2 characters").max(100, "Keep it under 100 characters"),
      contactPhone: usPhone,
      notes: z.string().trim().max(500, "Keep it under 500 characters"),
    })
    .superRefine((v, ctx) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^\d{2}:\d{2}$/.test(v.start) || !/^\d{2}:\d{2}$/.test(v.end)) return;
      const start = Date.parse(toBusinessIso(v.date, v.start));
      const end = Date.parse(toBusinessIso(v.date, v.end));
      if (start <= now) ctx.addIssue({ code: "custom", path: ["start"], message: "Pick a time that hasn't passed yet" });
      else if (start > now + PICKUP_MAX_DAYS_AHEAD * 24 * HOUR) ctx.addIssue({ code: "custom", path: ["date"], message: `Pick a day within the next ${PICKUP_MAX_DAYS_AHEAD} days` });
      if (end <= start) ctx.addIssue({ code: "custom", path: ["end"], message: "End after the start time" });
      else if (end - start > PICKUP_MAX_WINDOW_HOURS * HOUR) ctx.addIssue({ code: "custom", path: ["end"], message: `Keep the window to ${PICKUP_MAX_WINDOW_HOURS} hours or less` });
    });

export type PickupValues = z.input<ReturnType<typeof pickupSchema>>;
