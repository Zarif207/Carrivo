import { z } from "zod";

/*
 * POST /shipments/:id/pickup (contract §5). The API wants ISO date-times with an offset; the form takes a
 * Dhaka date plus start/end times and builds `YYYY-MM-DDTHH:mm:00+06:00`. Rules mirror the API:
 * start in the future and within 30 days, end after start, window at most 12 hours.
 */

export const PICKUP_MAX_DAYS_AHEAD = 30;
export const PICKUP_MAX_WINDOW_HOURS = 12;
const HOUR = 3_600_000;

export const toDhakaIso = (date: string, time: string) => `${date}T${time}:00+06:00`;

const phone = /^\+?[0-9\s-]{7,20}$/;

/** `now` is passed in (the form calls it at submit time) so the rules stay pure. */
export const pickupSchema = (now: number) =>
  z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day"),
      start: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
      end: z.string().regex(/^\d{2}:\d{2}$/, "Pick an end time"),
      pickupAddress: z.string().trim().min(5, "At least 5 characters").max(300, "Keep it under 300 characters"),
      contactName: z.string().trim().min(2, "At least 2 characters").max(100, "Keep it under 100 characters"),
      contactPhone: z.string().trim().regex(phone, "7-20 digits, optionally with +, spaces or dashes"),
      notes: z.string().trim().max(500, "Keep it under 500 characters"),
    })
    .superRefine((v, ctx) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^\d{2}:\d{2}$/.test(v.start) || !/^\d{2}:\d{2}$/.test(v.end)) return;
      const start = Date.parse(toDhakaIso(v.date, v.start));
      const end = Date.parse(toDhakaIso(v.date, v.end));
      if (start <= now) ctx.addIssue({ code: "custom", path: ["start"], message: "Pick a time that hasn't passed yet" });
      else if (start > now + PICKUP_MAX_DAYS_AHEAD * 24 * HOUR) ctx.addIssue({ code: "custom", path: ["date"], message: `Pick a day within the next ${PICKUP_MAX_DAYS_AHEAD} days` });
      if (end <= start) ctx.addIssue({ code: "custom", path: ["end"], message: "End after the start time" });
      else if (end - start > PICKUP_MAX_WINDOW_HOURS * HOUR) ctx.addIssue({ code: "custom", path: ["end"], message: `Keep the window to ${PICKUP_MAX_WINDOW_HOURS} hours or less` });
    });

export type PickupValues = z.input<ReturnType<typeof pickupSchema>>;
