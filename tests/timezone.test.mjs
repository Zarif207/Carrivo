import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUSINESS_TIME_ZONE, formatOffset, zonedDay, zonedDayFrom, zonedIso, zonedParts, zonedTimeToUtc } from "../src/lib/timezone.ts";

describe("business time zone", () => {
  it("defaults to America/New_York", () => {
    assert.equal(BUSINESS_TIME_ZONE, "America/New_York");
  });

  it("uses -05:00 in winter and -04:00 in summer (pickup windows)", () => {
    assert.equal(zonedIso("2026-11-10", "10:00"), "2026-11-10T10:00:00-05:00");
    assert.equal(zonedIso("2026-07-01", "10:00"), "2026-07-01T10:00:00-04:00");
    assert.equal(zonedTimeToUtc("2026-11-10", "10:00").toISOString(), "2026-11-10T15:00:00.000Z");
  });

  it("handles the DST switch days like the API", () => {
    // Spring forward 2026-03-08: 02:30 doesn't exist and resolves just after the jump.
    assert.equal(zonedTimeToUtc("2026-03-08", "03:30").toISOString(), "2026-03-08T07:30:00.000Z");
    // Fall back 2026-11-01: 01:30 happens twice; the first one (EDT) wins.
    assert.equal(zonedTimeToUtc("2026-11-01", "01:30").toISOString(), "2026-11-01T05:30:00.000Z");
    assert.equal(zonedTimeToUtc("2026-11-01", "00:00").toISOString(), "2026-11-01T04:00:00.000Z");
  });

  it("finds the New York day of an instant", () => {
    // 03:00 UTC on Jan 2 is still Jan 1 in New York.
    assert.equal(zonedDay(new Date("2026-01-02T03:00:00Z")), "2026-01-01");
    assert.equal(zonedParts(new Date("2026-01-02T03:00:00Z")).weekday, "Thu");
    assert.equal(zonedDayFrom(new Date("2026-01-02T03:00:00Z"), 1), "2026-01-02");
    assert.equal(zonedDayFrom(new Date("2026-03-07T20:00:00Z"), 1), "2026-03-08");
  });

  it("formats offsets", () => {
    assert.equal(formatOffset(-5 * 3_600_000), "-05:00");
    assert.equal(formatOffset(5.5 * 3_600_000), "+05:30");
  });
});
