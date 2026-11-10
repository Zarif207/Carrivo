import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SAME_DAY_REASON, describePriceProblem, sameDayAllowed } from "../src/lib/pricing/services.ts";
import { hubsInZone, sortZones, zoneOptions } from "../src/lib/zones.ts";
import { MAP_H, MAP_W, ZONE_LOCATIONS, locateZone } from "../src/lib/geo/us-map.ts";

const CHI = "11111111-1111-7111-8111-111111111111";
const ATL = "22222222-2222-7222-8222-222222222222";

describe("same-day rule", () => {
  it("allows Same day only when both zones are the same (or not chosen yet)", () => {
    assert.equal(sameDayAllowed(CHI, CHI), true);
    assert.equal(sameDayAllowed(CHI, ATL), false);
    assert.equal(sameDayAllowed(undefined, ATL), true);
    assert.equal(sameDayAllowed(CHI, ""), true);
  });
});

describe("describePriceProblem (API 422 → specific message)", () => {
  it("names the weight limit from the API message", () => {
    const problem = describePriceProblem("Weight exceeds the 20.00 lb limit for SAME_DAY", { serviceType: "SAME_DAY" });
    assert.equal(problem.field, "weightLb");
    assert.equal(problem.title, "Too heavy for Same day");
    assert.match(problem.message, /up to 20 lb/);
  });

  it("keeps a fractional limit", () => {
    assert.match(describePriceProblem("Weight exceeds the 12.50 lb limit for EXPRESS", { serviceType: "EXPRESS" }).message, /up to 12\.5 lb/);
  });

  it("explains Same day across two zones", () => {
    const problem = describePriceProblem("No pricing available for this service and route", { serviceType: "SAME_DAY", originZoneId: CHI, destinationZoneId: ATL });
    assert.equal(problem.field, "serviceType");
    assert.equal(problem.message, SAME_DAY_REASON);
  });

  it("reports a genuinely missing price with the route", () => {
    const problem = describePriceProblem("No pricing available for this service and route", {
      serviceType: "STANDARD",
      originZoneId: CHI,
      destinationZoneId: ATL,
      originName: "Chicago Metro",
      destinationName: "Atlanta Metro",
    });
    assert.equal(problem.title, "No price for this route yet");
    assert.match(problem.message, /no Standard price from Chicago Metro to Atlanta Metro/);
  });

  it("passes any other message through", () => {
    assert.equal(describePriceProblem("Something else", {}).message, "Something else");
  });
});

describe("zones and hubs in pickers", () => {
  const zones = [
    { id: "z3", name: "Seattle Metro" },
    { id: "z1", name: "Atlanta Metro" },
    { id: "z2", name: "Chicago Metro" },
  ];
  const zone = (id) => ({ id, name: id, code: id.toUpperCase() });
  const hubs = [
    { id: "h1", name: "Westside Hub", code: "HUB-ATL", city: "Atlanta", isActive: true, zone: zone("z1") },
    { id: "h2", name: "Airport South Hub", code: "HUB-ATL-AP", city: "Atlanta", isActive: true, zone: zone("z1") },
    { id: "h3", name: "Clearing Hub", code: "HUB-CHI", city: "Chicago", isActive: true, zone: zone("z2") },
    { id: "h4", name: "Closed Hub", code: "HUB-ATL-X", city: "Atlanta", isActive: false, zone: zone("z1") },
  ];

  it("sorts zones A–Z", () => {
    assert.deepEqual(sortZones(zones).map((z) => z.name), ["Atlanta Metro", "Chicago Metro", "Seattle Metro"]);
    assert.deepEqual(zoneOptions(zones)[0], { value: "z1", label: "Atlanta Metro" });
  });

  it("lists only the chosen zone's active hubs, main hub first", () => {
    assert.deepEqual(hubsInZone(hubs, "z1").map((h) => h.id), ["h1", "h2"]);
    assert.deepEqual(hubsInZone(hubs, "z2").map((h) => h.id), ["h3"]);
    assert.deepEqual(hubsInZone(hubs, undefined), []);
  });
});

describe("coverage map pins", () => {
  it("places all eight seeded metros inside the map", () => {
    const names = ["New York Metro", "Los Angeles Metro", "Chicago Metro", "Houston Metro", "Miami Metro", "San Francisco Bay Area", "Seattle Metro", "Atlanta Metro"];
    for (const name of names) {
      const pin = locateZone(name);
      assert.ok(pin, name);
      assert.ok(pin.x > 0 && pin.x < MAP_W && pin.y > 0 && pin.y < MAP_H, `${name} inside the map`);
    }
    assert.equal(Object.keys(ZONE_LOCATIONS).length, 8);
  });

  it("puts west in the west and north in the north", () => {
    const [sea, mia, la, nyc] = ["Seattle Metro", "Miami Metro", "Los Angeles Metro", "New York Metro"].map((n) => locateZone(n));
    assert.ok(la.x < nyc.x, "Los Angeles west of New York");
    assert.ok(sea.y < mia.y, "Seattle north of Miami");
  });

  it("leaves an unknown zone off the map instead of guessing", () => {
    assert.equal(locateZone("Denver Metro"), null);
    assert.equal(locateZone(""), null);
  });
});
