/*
 * Geometry for the home page's stylised US map. Plain module (server-safe, no React).
 *
 * The API's zones and hubs have no coordinates (contract §7), so each zone's pin comes from a small
 * lookup table of approximate metro centres keyed by zone name. A zone that isn't in the table gets
 * no pin (it is still listed in the coverage cards), so the map never shows a wrong location.
 */

export const MAP_W = 600;
export const MAP_H = 370;
const PAD = 12;

/** Simplified outline of the contiguous United States (lon, lat), clockwise from the Olympic Peninsula. */
const OUTLINE: [number, number][] = [
  [-124.7, 48.4], [-122.8, 49.0], [-95.2, 49.0], [-89.6, 48.0], [-84.6, 46.5], [-83.5, 45.9], [-82.5, 45.3],
  [-82.4, 43.0], [-83.1, 42.3], [-82.7, 41.7], [-79.0, 42.9], [-79.2, 43.4], [-76.3, 44.2], [-74.7, 45.0],
  [-71.5, 45.0], [-70.0, 46.7], [-69.2, 47.4], [-67.8, 47.1], [-67.8, 45.7], [-67.0, 44.8], [-68.8, 44.3],
  [-70.2, 43.7], [-70.7, 42.7], [-70.0, 41.7], [-71.4, 41.4], [-72.9, 41.2], [-73.9, 40.6], [-74.0, 39.6],
  [-74.9, 38.9], [-75.1, 38.3], [-75.9, 37.1], [-76.0, 36.9], [-75.5, 35.2], [-76.5, 34.7], [-77.9, 33.9],
  [-79.2, 33.2], [-80.9, 32.0], [-81.4, 30.7], [-81.3, 29.9], [-80.6, 28.4], [-80.0, 26.7], [-80.4, 25.2],
  [-81.1, 25.1], [-81.8, 26.1], [-82.7, 27.7], [-82.8, 29.2], [-84.0, 30.1], [-85.4, 29.7], [-87.5, 30.3],
  [-88.6, 30.4], [-89.6, 30.2], [-89.4, 29.0], [-90.5, 29.1], [-92.0, 29.6], [-93.8, 29.7], [-95.0, 29.2],
  [-96.6, 28.3], [-97.4, 27.3], [-97.2, 25.95], [-99.1, 26.4], [-99.8, 27.6], [-101.4, 29.8], [-103.2, 29.0],
  [-104.5, 29.6], [-106.5, 31.8], [-108.2, 31.8], [-108.2, 31.33], [-111.1, 31.33], [-114.8, 32.5],
  [-117.1, 32.5], [-117.3, 33.2], [-118.2, 33.75], [-118.5, 34.0], [-119.2, 34.2], [-120.6, 34.5],
  [-120.7, 35.2], [-121.9, 36.6], [-122.5, 37.7], [-123.0, 38.2], [-123.8, 39.4], [-124.4, 40.4],
  [-124.2, 41.9], [-124.5, 42.8], [-123.9, 46.2], [-124.1, 46.9],
];

/** Equidistant conic (standard parallel 39°N): parallels curve and meridians lean in, like a printed US map. */
function raw(lon: number, lat: number): [number, number] {
  const rad = Math.PI / 180;
  const phi0 = 39 * rad;
  const n = Math.sin(phi0);
  const r = 1 / Math.tan(phi0) + (phi0 - lat * rad);
  const theta = n * (lon + 96) * rad;
  return [r * Math.sin(theta), r * Math.cos(theta)];
}

// Fit the outline's bounds into the viewBox (same scale on both axes, centred).
const RAW = OUTLINE.map(([lon, lat]) => raw(lon, lat));
const minX = Math.min(...RAW.map((p) => p[0]));
const maxX = Math.max(...RAW.map((p) => p[0]));
const minY = Math.min(...RAW.map((p) => p[1]));
const maxY = Math.max(...RAW.map((p) => p[1]));
const SCALE = Math.min((MAP_W - PAD * 2) / (maxX - minX), (MAP_H - PAD * 2) / (maxY - minY));
const OFFSET_X = (MAP_W - (maxX - minX) * SCALE) / 2;
const OFFSET_Y = (MAP_H - (maxY - minY) * SCALE) / 2;

const round = (value: number) => Math.round(value * 10) / 10;

export function project(lon: number, lat: number): { x: number; y: number } {
  const [x, y] = raw(lon, lat);
  return { x: round(OFFSET_X + (x - minX) * SCALE), y: round(OFFSET_Y + (y - minY) * SCALE) };
}

export const US_OUTLINE_PATH = `${OUTLINE.map(([lon, lat], i) => {
  const { x, y } = project(lon, lat);
  return `${i === 0 ? "M" : "L"}${x} ${y}`;
}).join(" ")}Z`;

interface ZoneLocation {
  lat: number;
  lon: number;
}

/**
 * Approximate metro centres, keyed by the zone's normalised name (see `zoneKey`). Add a row when a
 * zone opens; until then the zone is listed in the cards only, never pinned in a guessed place.
 */
export const ZONE_LOCATIONS: Readonly<Record<string, ZoneLocation>> = {
  "ann arbor": { lat: 42.28, lon: -83.74 },
  atlanta: { lat: 33.75, lon: -84.39 },
  chicago: { lat: 41.88, lon: -87.63 },
  "dallas fort worth": { lat: 32.78, lon: -96.8 },
  detroit: { lat: 42.33, lon: -83.05 },
  flint: { lat: 43.01, lon: -83.69 },
  "grand rapids": { lat: 42.96, lon: -85.67 },
  houston: { lat: 29.76, lon: -95.37 },
  lansing: { lat: 42.73, lon: -84.56 },
  "los angeles": { lat: 34.05, lon: -118.24 },
  miami: { lat: 25.76, lon: -80.19 },
  "new york": { lat: 40.71, lon: -74.01 },
  philadelphia: { lat: 39.95, lon: -75.17 },
  phoenix: { lat: 33.45, lon: -112.07 },
  "washington dc": { lat: 38.91, lon: -77.04 },
};

/**
 * "Dallas–Fort Worth" → "dallas fort worth", "Washington, D.C. Metro" → "washington dc": lower case,
 * any dash or punctuation folded, and a trailing "Metro"/"Metro Area"/"Area" dropped.
 */
export function zoneKey(zoneName: string): string {
  return zoneName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u2010-\u2015-]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(metro area|metro|area)$/, "");
}

export interface ZonePin {
  x: number;
  y: number;
}

/** The map position for a zone, or null when the table doesn't know it (it then appears in the cards only). */
export function locateZone(zoneName: string): ZonePin | null {
  const location = ZONE_LOCATIONS[zoneKey(zoneName)];
  return location ? project(location.lon, location.lat) : null;
}
