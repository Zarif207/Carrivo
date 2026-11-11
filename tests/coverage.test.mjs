import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLUSTER_RADIUS, COMPACT_CLUSTER_RADIUS, buildCoverage, buildRoutes, clusterPins, coverageAreas, directionsUrl, labelBox, placeLabels, stateOf, telHref } from "../src/lib/coverage.ts";
import { locateZone } from "../src/lib/geo/us-map.ts";
import { US_STATES } from "../src/lib/us.ts";

const GEO = { locate: locateZone, stateName: (code) => US_STATES.find(([c]) => c === code)?.[1] };

/* The live network as of 11/11/2026: 15 zones, 17 hubs (two each in New York and Los Angeles). */
const LIVE = [
  ["A2", "Ann Arbor Metro", "MI"], ["ATL", "Atlanta Metro", "GA"], ["CHI", "Chicago Metro", "IL"], ["DFW", "Dallas–Fort Worth", "TX"],
  ["DET", "Detroit Metro", "MI"], ["FNT", "Flint Metro", "MI"], ["GRR", "Grand Rapids Metro", "MI"], ["HOU", "Houston Metro", "TX"],
  ["LAN", "Lansing Metro", "MI"], ["LA", "Los Angeles Metro", "CA"], ["MIA", "Miami Metro", "FL"], ["NYC", "New York Metro", "NY"],
  ["PHL", "Philadelphia Metro", "PA"], ["PHX", "Phoenix Metro", "AZ"], ["WDC", "Washington DC Metro", "DC"],
];
const zone = (code, name, extra = {}) => ({ id: `z-${code}`, name, code, description: "One, Two and Three.", isActive: true, createdAt: "", updatedAt: "", ...extra });
const hub = (code, state, n = 0) => ({
  id: `h-${code}-${n}`, name: `${code} Hub ${n}`, code: n ? `HUB-${code}-${n}` : `HUB-${code}`, address: `1 Main St, Town, ${state} 1000${n}`,
  city: "Town", phone: "(313) 555-0111", isActive: true, zone: { id: `z-${code}`, name: code, code }, createdAt: "", updatedAt: "",
});
const zones = LIVE.map(([code, name]) => zone(code, name));
const hubs = [...LIVE.map(([code, , state]) => hub(code, state)), hub("NYC", "NJ", 1), hub("LA", "CA", 1)];

/** Connected components of the route graph. */
function components(ids, routes) {
  const seen = new Set();
  let count = 0;
  for (const id of ids) {
    if (seen.has(id)) continue;
    count += 1;
    const stack = [id];
    while (stack.length) {
      const at = stack.pop();
      if (seen.has(at)) continue;
      seen.add(at);
      for (const r of routes) if (r.from === at) stack.push(r.to); else if (r.to === at) stack.push(r.from);
    }
  }
  return count;
}

describe("coverage model", () => {
  const model = buildCoverage(zones, hubs, GEO);

  it("counts what the API returns (nothing fixed at 15)", () => {
    assert.deepEqual({ zones: model.stats.zones, hubs: model.stats.hubs }, { zones: 15, hubs: 17 });
    assert.equal(model.unplaced, 0);
    const smaller = buildCoverage(zones.slice(0, 4), hubs, GEO);
    assert.equal(smaller.stats.zones, 4);
  });

  it("groups zones by the state of their hubs, Michigan on its own", () => {
    const region = Object.fromEntries(model.zones.map((z) => [z.code, z.region]));
    assert.equal(region.DET, "Michigan");
    assert.equal(region.WDC, "South");
    assert.equal(region.NYC, "Northeast");
    assert.equal(region.PHX, "West");
    assert.equal(region.CHI, "Midwest");
  });

  it("gives every placed zone at least one route, in one connected network, without all pairs", () => {
    for (const z of model.zones) assert.ok(z.routesTo.length > 0, `${z.code} has a route`);
    assert.equal(components(model.zones.map((z) => z.id), model.routes), 1);
    assert.ok(model.routes.length < (15 * 14) / 2 / 2, "far fewer than all pairs");
    assert.ok(model.routes.some((r) => r.spine), "has a national spine");
  });

  it("clusters the Michigan metros into one marker and keeps the rest apart", () => {
    const { markers } = model.layouts.wide;
    const clusters = markers.filter((m) => m.zoneIds.length > 1);
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0].label, "Michigan");
    assert.deepEqual(clusters[0].zoneIds.map((id) => id.slice(2)).sort(), ["A2", "DET", "FNT", "GRR", "LAN"]);
    assert.equal(markers.length, 11);
    // No two markers closer than the cluster radius.
    for (const a of markers) for (const b of markers) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= CLUSTER_RADIUS);
  });

  it("spreads phone pins far enough apart for 24px touch targets, naming mixed clusters by their parts, west to east", () => {
    const { markers, mapRoutes } = model.layouts.compact;
    for (const a of markers) for (const b of markers) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= COMPACT_CLUSTER_RADIUS);
    const labels = markers.filter((m) => m.zoneIds.length > 1).map((m) => m.label).sort();
    assert.deepEqual(labels, ["Chicago and Michigan", "Texas", "Washington DC, Philadelphia and New York"]);
    assert.equal(markers.flatMap((m) => m.zoneIds).length, 15, "every placed zone is in exactly one marker");
    assert.ok(mapRoutes.length > 0);
  });

  it("lists an unknown zone in the cards but never on the map", () => {
    const withNew = buildCoverage([...zones, zone("DEN", "Denver Metro")], [...hubs, hub("DEN", "CO")], GEO);
    const denver = withNew.zones.find((z) => z.code === "DEN");
    assert.equal(denver.pin, null);
    assert.equal(denver.region, "West");
    assert.deepEqual(denver.routesTo, []);
    assert.equal(withNew.unplaced, 1);
    assert.ok(!withNew.layouts.wide.markers.some((m) => m.zoneIds.includes(denver.id)));
    assert.ok(!withNew.layouts.compact.markers.some((m) => m.zoneIds.includes(denver.id)));
    assert.ok(!withNew.routes.some((r) => r.from === denver.id || r.to === denver.id));
  });

  it("leaves inactive zones and hubs out", () => {
    const m = buildCoverage([...zones, zone("OLD", "Old Metro", { isActive: false })], [...hubs, { ...hub("CHI", "IL", 2), isActive: false }], GEO);
    assert.equal(m.stats.zones, 15);
    assert.equal(m.zones.find((z) => z.code === "CHI").hubs.length, 1);
  });
});

describe("route graph", () => {
  it("joins far-apart groups so no zone is isolated", () => {
    const far = [
      { id: "a", name: "A", region: "West", hubs: [], areas: [], pin: { x: 0, y: 0 } },
      { id: "b", name: "B", region: "West", hubs: [], areas: [], pin: { x: 1, y: 0 } },
      { id: "c", name: "C", region: "West", hubs: [], areas: [], pin: { x: 500, y: 0 } },
      { id: "d", name: "D", region: "West", hubs: [], areas: [], pin: { x: 501, y: 0 } },
    ];
    const routes = buildRoutes(far, 1);
    assert.equal(components(["a", "b", "c", "d"], routes), 1);
  });

  it("handles one zone and no zones", () => {
    assert.deepEqual(buildRoutes([{ id: "a", name: "A", region: "West", hubs: [], areas: [], pin: { x: 1, y: 1 } }]), []);
    assert.deepEqual(buildRoutes([]), []);
    assert.deepEqual(clusterPins([], CLUSTER_RADIUS), []);
  });
});

describe("labels", () => {
  it("keeps labels off other pins and inside the map", () => {
    const items = [
      { id: "a", x: 590, y: 100, text: "NYC", r: 5 },
      { id: "b", x: 300, y: 100, text: "CHI", r: 5 },
      { id: "c", x: 320, y: 100, text: "DET", r: 5 },
    ];
    const sides = placeLabels(items, 600, 370);
    assert.notEqual(sides.a, "right", "no room on the right edge");
    assert.notEqual(sides.b, "right", "CHI's right side is DET's pin");
    for (const item of items) {
      const box = labelBox(item, sides[item.id], 12);
      assert.ok(box[0] >= 0 && box[2] <= 600, `${item.id} inside`);
    }
  });
});

describe("zone card helpers", () => {
  it("splits a description into coverage areas", () => {
    assert.deepEqual(coverageAreas("Flint, Burton, Grand Blanc and Flushing."), ["Flint", "Burton", "Grand Blanc", "Flushing"]);
    assert.deepEqual(coverageAreas("Washington DC, Arlington, Alexandria and nearby Maryland suburbs."), ["Washington DC", "Arlington", "Alexandria", "Nearby Maryland suburbs"]);
    assert.deepEqual(coverageAreas("Downtown LA, Santa Monica, Pasadena and Long Beach"), ["Downtown LA", "Santa Monica", "Pasadena", "Long Beach"]);
    assert.deepEqual(coverageAreas(null), []);
  });

  it("reads the state from a US address", () => {
    assert.equal(stateOf("2 Woodward Ave, Detroit, MI 48226"), "MI");
    assert.equal(stateOf("1350 Pennsylvania Ave NW, Washington, DC 20004"), "DC");
    assert.equal(stateOf("somewhere"), null);
  });

  it("builds tel: and Google Maps links", () => {
    assert.equal(telHref("(313) 555-0111"), "tel:+13135550111");
    assert.equal(directionsUrl("2 Woodward Ave, Detroit, MI 48226"), "https://www.google.com/maps/search/?api=1&query=2%20Woodward%20Ave%2C%20Detroit%2C%20MI%2048226");
  });
});
