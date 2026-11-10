/*
 * Geometry for the home page's stylised US map. Plain module (server-safe, no React).
 *
 * The API's hubs have no coordinates (contract §7), only a US address ending in "City, ST ZIP".
 * A hub is placed from that address: a known city's real coordinates, else the state's centre.
 * Positions are approximate on purpose: the map is a picture, the hub list beside it is exact.
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

/** Real coordinates of large US cities and the seeded hub cities ("city|ST" → [lon, lat]). */
const CITIES: Record<string, [number, number]> = {
  "new york|NY": [-74.0, 40.71], "long island city|NY": [-73.94, 40.74], "brooklyn|NY": [-73.95, 40.65], "jersey city|NJ": [-74.08, 40.72],
  "newark|NJ": [-74.17, 40.74], "los angeles|CA": [-118.24, 34.05], "long beach|CA": [-118.19, 33.77], "san francisco|CA": [-122.42, 37.77],
  "oakland|CA": [-122.27, 37.8], "san diego|CA": [-117.16, 32.72], "san jose|CA": [-121.89, 37.34], "sacramento|CA": [-121.49, 38.58],
  "seattle|WA": [-122.33, 47.61], "portland|OR": [-122.68, 45.52], "las vegas|NV": [-115.14, 36.17], "phoenix|AZ": [-112.07, 33.45],
  "denver|CO": [-104.99, 39.74], "salt lake city|UT": [-111.89, 40.76], "dallas|TX": [-96.8, 32.78], "fort worth|TX": [-97.33, 32.76],
  "houston|TX": [-95.37, 29.76], "austin|TX": [-97.74, 30.27], "san antonio|TX": [-98.49, 29.42], "chicago|IL": [-87.63, 41.88],
  "minneapolis|MN": [-93.27, 44.98], "detroit|MI": [-83.05, 42.33], "atlanta|GA": [-84.39, 33.75], "miami|FL": [-80.19, 25.76],
  "orlando|FL": [-81.38, 28.54], "tampa|FL": [-82.46, 27.95], "boston|MA": [-71.06, 42.36], "philadelphia|PA": [-75.17, 39.95],
  "pittsburgh|PA": [-79.99, 40.44], "washington|DC": [-77.04, 38.91], "baltimore|MD": [-76.61, 39.29], "charlotte|NC": [-80.84, 35.23],
  "nashville|TN": [-86.78, 36.16], "new orleans|LA": [-90.07, 29.95], "kansas city|MO": [-94.58, 39.1], "st. louis|MO": [-90.2, 38.63],
  "columbus|OH": [-82.99, 39.96], "cleveland|OH": [-81.69, 41.5], "indianapolis|IN": [-86.16, 39.77],
};

/** Approximate centres of the lower-48 states and DC (used when the hub's city isn't listed above). */
const STATES: Record<string, [number, number]> = {
  AL: [-86.8, 32.8], AZ: [-111.7, 34.3], AR: [-92.4, 34.9], CA: [-119.5, 37.2], CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0],
  DC: [-77.0, 38.9], FL: [-81.7, 28.6], GA: [-83.4, 32.7], ID: [-114.6, 44.4], IL: [-89.2, 40.0], IN: [-86.3, 39.9], IA: [-93.5, 42.1],
  KS: [-98.4, 38.5], KY: [-85.3, 37.5], LA: [-92.0, 31.0], ME: [-69.2, 45.4], MD: [-76.8, 39.0], MA: [-71.8, 42.3], MI: [-84.7, 43.6],
  MN: [-94.3, 46.3], MS: [-89.7, 32.7], MO: [-92.5, 38.4], MT: [-109.6, 47.0], NE: [-99.8, 41.5], NV: [-116.6, 39.3], NH: [-71.6, 43.7],
  NJ: [-74.7, 40.1], NM: [-106.1, 34.4], NY: [-75.5, 42.9], NC: [-79.4, 35.6], ND: [-100.5, 47.5], OH: [-82.8, 40.3], OK: [-97.5, 35.6],
  OR: [-120.6, 43.9], PA: [-77.6, 40.9], RI: [-71.5, 41.7], SC: [-80.9, 33.9], SD: [-100.2, 44.4], TN: [-86.3, 35.9], TX: [-99.3, 31.5],
  UT: [-111.7, 39.3], VT: [-72.7, 44.1], VA: [-78.8, 37.5], WA: [-120.5, 47.4], WV: [-80.6, 38.6], WI: [-89.8, 44.6], WY: [-107.5, 43.0],
};

/** The state from "…, City, ST 12345" (the API's US address format). */
function stateOf(address: string): string | null {
  return /,\s*[^,]+,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\s*$/.exec(address.trim())?.[1] ?? null;
}

/** Position of a hub on the map, or null when its address isn't a lower-48 US address. */
export function locateHub(hub: { address: string; city: string }): { x: number; y: number } | null {
  const state = stateOf(hub.address);
  if (!state) return null;
  const known = CITIES[`${hub.city.trim().toLowerCase()}|${state}`] ?? STATES[state];
  return known ? project(known[0], known[1]) : null;
}

export interface MapCluster<T> {
  x: number;
  y: number;
  items: T[];
}

/** Merges points closer than `radius` (viewBox units), so neighbouring hubs share one pin. */
export function clusterPoints<T>(points: { x: number; y: number; item: T }[], radius = 24): MapCluster<T>[] {
  const clusters: MapCluster<T>[] = [];
  for (const point of points) {
    const near = clusters.find((c) => Math.hypot(c.x - point.x, c.y - point.y) < radius);
    if (near) {
      const n = near.items.length;
      near.x = round((near.x * n + point.x) / (n + 1));
      near.y = round((near.y * n + point.y) / (n + 1));
      near.items.push(point.item);
    } else {
      clusters.push({ x: point.x, y: point.y, items: [point.item] });
    }
  }
  return clusters;
}
