"use client";

// Client: pins react to hover, focus and taps (shared highlight with the zone cards), the regional
// inset opens and closes, and the route animation runs only while the map is on screen.
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { arcPath, listNames, placeLabels, shortName, type CoverageModel, type CoverageZone, type MapMarker } from "@/lib/coverage";
import { MAP_H, MAP_W, US_OUTLINE_PATH } from "@/lib/geo/us-map";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/scroll";
import { cn } from "@/lib/utils";

const PIN_R = 5;
const CLUSTER_R = 10;
const LABEL_FONT = 12;
const pct = (value: number, total: number) => `${(value / total) * 100}%`;
const hubCount = (n: number) => (n === 1 ? "1 hub" : `${n} hubs`);

interface NetworkMapProps {
  model: CoverageModel;
  /** Zone highlighted from a card or a pin (null: nothing). */
  active: string | null;
  onActivate: (zoneId: string | null) => void;
  /** A pin or inset entry was chosen: show its card. */
  onSelect: (zoneId: string) => void;
}

/** Plays the map only while it's on screen and motion is allowed (else static routes, no parcels). */
function useLiveMotion(target: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setMotion(!media.matches);
    sync();
    media.addEventListener("change", sync);
    const node = target.current;
    const observer = node ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" }) : null;
    if (node) observer?.observe(node);
    return () => {
      media.removeEventListener("change", sync);
      observer?.disconnect();
    };
  }, [target]);
  return visible && motion;
}

type LayoutKey = "wide" | "compact";
const LAYOUT_CLASS: Record<LayoutKey, string> = { wide: "hidden sm:block", compact: "sm:hidden" };

/** True from 640px up (the wide layout is showing). */
function useWide(): boolean {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return wide;
}

interface ClusterControls {
  open: string | null;
  show: (key: string) => void;
  hideSoon: () => void;
  close: () => void;
}

export function NetworkMap({ model, active, onActivate, onSelect }: NetworkMapProps) {
  const frame = useRef<HTMLDivElement>(null);
  const live = useLiveMotion(frame);
  const wide = useWide();
  const zoneById = useMemo(() => new Map(model.zones.map((zone) => [zone.id, zone])), [model.zones]);
  const insetId = useId();
  const clusterButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const [openCluster, setOpenCluster] = useState<string | null>(null);
  const closeTimer = useRef(0);
  const actions = useMemo(
    () => ({
      show: (key: string) => {
        window.clearTimeout(closeTimer.current);
        setOpenCluster(key);
      },
      hideSoon: () => {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpenCluster(null), 250);
      },
      close: () => {
        window.clearTimeout(closeTimer.current);
        setOpenCluster(null);
      },
    }),
    [],
  );
  const clusters: ClusterControls = { open: openCluster, ...actions };
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // An open inset closes on Escape (focus back to its pin) and on a tap or click anywhere else.
  useEffect(() => {
    if (!openCluster) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      actions.close();
      clusterButtons.current[openCluster]?.focus();
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const panel = document.getElementById(`${insetId}-${openCluster}`);
      if (!panel?.contains(target) && !clusterButtons.current[openCluster]?.contains(target)) actions.close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [openCluster, actions, insetId]);

  const placed = model.zones.filter((zone) => zone.pin);
  const routeCount = model.routes.length;
  const layers: LayoutKey[] = ["wide", "compact"];

  return (
    <figure className="flex flex-col gap-4">
      <div
        ref={frame}
        className="coverage-net relative rounded-2xl bg-white/[0.035] p-3 ring-1 ring-sidebar-border sm:p-5"
        data-live={live ? "" : undefined}
      >
        <div className="relative aspect-[600/370] w-full">
          {/* Both layouts are server-rendered; CSS shows one, so there is no hydration mismatch. */}
          {layers.map((key) => (
            <MapLayer
              key={key}
              layoutKey={key}
              model={model}
              zoneById={zoneById}
              active={active}
              live={live && wide === (key === "wide")}
              clusters={clusters}
              insetId={insetId}
              clusterButtons={clusterButtons}
              onActivate={onActivate}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Regional insets: over a free corner of the map from sm up, under the map on phones. */}
        {layers.flatMap((key) =>
          model.layouts[key].markers
            .filter((marker) => marker.zoneIds.length > 1)
            .map((marker) => {
              const clusterKey = `${key}:${marker.id}`;
              return (
                <ClusterInset
                  key={clusterKey}
                  id={`${insetId}-${clusterKey}`}
                  marker={marker}
                  markers={model.layouts[key].markers}
                  routes={model.routes}
                  zoneById={zoneById}
                  open={openCluster === clusterKey}
                  live={live}
                  active={active}
                  onActivate={onActivate}
                  onSelect={(zoneId) => {
                    actions.close();
                    onSelect(zoneId);
                  }}
                  onClose={() => {
                    actions.close();
                    clusterButtons.current[clusterKey]?.focus();
                  }}
                  onPointerEnter={() => actions.show(clusterKey)}
                  onPointerLeave={actions.hideSoon}
                  onFocusOut={(next) => {
                    const button = clusterButtons.current[clusterKey];
                    if (!next || (next !== button && !document.getElementById(`${insetId}-${clusterKey}`)?.contains(next))) actions.close();
                  }}
                />
              );
            }),
        )}
      </div>

      <figcaption className="space-y-1 text-sm text-sidebar-muted">
        <Readout zone={active ? zoneById.get(active) : undefined} zoneById={zoneById} />
        <p>
          Pins mark metro areas, not exact hub addresses.
          {model.unplaced > 0 ? ` ${model.unplaced === 1 ? "One zone isn't" : `${model.unplaced} zones aren't`} on the map yet; every zone is listed below.` : null}
        </p>
        {/* Text alternative for the drawing. */}
        <span className="sr-only">
          Network map of {placed.length} {placed.length === 1 ? "zone" : "zones"} joined by {routeCount} {routeCount === 1 ? "route" : "routes"}.
        </span>
        <ul className="sr-only">
          {placed.map((zone) => (
            <li key={zone.id}>
              {zone.name}: {hubCount(zone.hubs.length)}, routes to {listNames(zone.routesTo.map((code) => [...zoneById.values()].find((z) => z.code === code)?.name ?? code))}.
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

interface MapLayerProps {
  layoutKey: LayoutKey;
  model: CoverageModel;
  zoneById: Map<string, CoverageZone>;
  active: string | null;
  /** Animate (on screen, motion allowed, and this layout is the one showing). */
  live: boolean;
  clusters: ClusterControls;
  insetId: string;
  clusterButtons: React.RefObject<Record<string, HTMLButtonElement | null>>;
  onActivate: (zoneId: string | null) => void;
  onSelect: (zoneId: string) => void;
}

/** One layout of the map: the drawing plus real buttons over each pin. */
function MapLayer({ layoutKey, model, zoneById, active, live, clusters, insetId, clusterButtons, onActivate, onSelect }: MapLayerProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { markers, mapRoutes } = model.layouts[layoutKey];
  const markerById = useMemo(() => new Map(markers.map((marker) => [marker.id, marker])), [markers]);
  const dotsId = `coverage-dots-${layoutKey}`;

  // SMIL parcels follow the same switch as the CSS (pause, not just hide, so they cost nothing).
  useEffect(() => {
    if (live) svg.current?.unpauseAnimations();
    else svg.current?.pauseAnimations();
  }, [live]);

  const sides = useMemo(() => {
    const text = (marker: MapMarker) => marker.label || (zoneById.get(marker.zoneIds[0])?.code ?? "");
    return {
      text,
      side: placeLabels(
        markers.map((marker) => ({ id: marker.id, x: marker.x, y: marker.y, text: text(marker), r: marker.zoneIds.length > 1 ? CLUSTER_R : PIN_R })),
        MAP_W,
        MAP_H,
        LABEL_FONT,
      ),
    };
  }, [markers, zoneById]);

  const highlighted = (zoneIds: readonly string[]) => active !== null && zoneIds.includes(active);

  return (
    <div className={cn("absolute inset-0", LAYOUT_CLASS[layoutKey])}>
      <svg ref={svg} viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <pattern id={dotsId} width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="1.6" fill="currentColor" fillOpacity="0.22" />
          </pattern>
        </defs>
        <path d={US_OUTLINE_PATH} fill={`url(#${dotsId})`} />
        <path d={US_OUTLINE_PATH} fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.25" strokeLinejoin="round" />

        {/* Routes: a faint track, the flowing dashes on top, and a parcel riding along. */}
        {mapRoutes.map((route, i) => {
          const from = markerById.get(route.from);
          const to = markerById.get(route.to);
          if (!from || !to) return null;
          const d = arcPath(from, to);
          const on = highlighted(route.zoneIds);
          const dim = active !== null && !on;
          const length = Math.hypot(to.x - from.x, to.y - from.y);
          return (
            <g key={route.id} className="transition-opacity duration-300" opacity={dim ? 0.18 : 1}>
              <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth={route.spine ? 3 : 2} strokeLinecap="round" />
              <path
                data-flow=""
                d={d}
                fill="none"
                className="stroke-brand"
                strokeOpacity={on ? 1 : 0.75}
                strokeWidth={on ? 3 : route.spine ? 2.25 : 1.5}
                strokeDasharray="4 8"
                strokeLinecap="round"
                style={{ "--delay": `${-(i % 7) * 0.2}s` } as CSSProperties}
              />
              {live ? (
                <circle r={on ? 3.4 : 2.6} className="fill-ink-foreground">
                  <animateMotion dur={`${Math.max(2.8, length / 45).toFixed(1)}s`} begin={`${-((i * 0.37) % 2.6).toFixed(2)}s`} repeatCount="indefinite" path={d} />
                </circle>
              ) : null}
            </g>
          );
        })}

        {/* Pins: clusters show their zone count. */}
        {markers.map((marker, i) => {
          const on = highlighted(marker.zoneIds) || clusters.open === `${layoutKey}:${marker.id}`;
          const cluster = marker.zoneIds.length > 1;
          return (
            <g key={marker.id}>
              <circle data-pulse="" cx={marker.x} cy={marker.y} r={cluster ? CLUSTER_R : PIN_R + 2} className="fill-brand" style={{ "--delay": `${(i * 0.45) % 2.6}s` } as CSSProperties} />
              {cluster ? (
                <>
                  <circle cx={marker.x} cy={marker.y} r={CLUSTER_R + (on ? 2 : 0)} className="fill-brand stroke-ink transition-[r]" strokeWidth="2.5" />
                  <text x={marker.x} y={marker.y} dy="0.35em" textAnchor="middle" fontSize="11" className="fill-brand-foreground font-extrabold tabular">
                    {marker.zoneIds.length}
                  </text>
                </>
              ) : (
                <>
                  <circle cx={marker.x} cy={marker.y} r={PIN_R + (on ? 1.5 : 0)} className="fill-ink stroke-brand transition-[r]" strokeWidth={on ? 3 : 2.5} />
                  <circle cx={marker.x} cy={marker.y} r={on ? 2.6 : 2} className="fill-brand" />
                </>
              )}
            </g>
          );
        })}

        {/* Labels on the wide layout only; on phones the readout below names the pin. */}
        {layoutKey === "wide"
          ? markers.map((marker) => {
              const side = sides.side[marker.id] ?? "right";
              const gap = (marker.zoneIds.length > 1 ? CLUSTER_R : PIN_R) + 3;
              const props =
                side === "right"
                  ? { x: marker.x + gap, y: marker.y, dy: "0.35em", textAnchor: "start" as const }
                  : side === "left"
                    ? { x: marker.x - gap, y: marker.y, dy: "0.35em", textAnchor: "end" as const }
                    : side === "above"
                      ? { x: marker.x, y: marker.y - gap, dy: "-0.2em", textAnchor: "middle" as const }
                      : { x: marker.x, y: marker.y + gap, dy: "0.95em", textAnchor: "middle" as const };
              return (
                <text
                  key={marker.id}
                  {...props}
                  fontSize={LABEL_FONT}
                  className={cn("font-bold transition-[fill]", highlighted(marker.zoneIds) ? "fill-brand-text" : "fill-ink-foreground")}
                  paintOrder="stroke"
                  stroke="var(--ink)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                >
                  {sides.text(marker)}
                </text>
              );
            })
          : null}
      </svg>

      {/* Hit targets: real buttons over the drawing (names, focus rings, taps). */}
      {markers.map((marker) => {
        if (marker.zoneIds.length === 1) {
          return <ZonePinButton key={marker.id} marker={marker} zone={zoneById.get(marker.zoneIds[0])} zoneById={zoneById} onActivate={onActivate} onSelect={onSelect} />;
        }
        const key = `${layoutKey}:${marker.id}`;
        const open = clusters.open === key;
        return (
          <button
            key={marker.id}
            ref={(node) => {
              clusterButtons.current[key] = node;
            }}
            type="button"
            aria-expanded={open}
            aria-controls={`${insetId}-${key}`}
            aria-label={`${marker.label}: ${marker.zoneIds.length} zones close together. ${open ? "Hide" : "Show"} the regional map.`}
            className="absolute z-10 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand sm:size-10"
            style={{ left: pct(marker.x, MAP_W), top: pct(marker.y, MAP_H) }}
            onPointerEnter={(event) => event.pointerType === "mouse" && clusters.show(key)}
            onPointerLeave={(event) => event.pointerType === "mouse" && clusters.hideSoon()}
            // Keyboard focus opens it; a tap or click focuses too, but its click toggles instead.
            onFocus={(event) => event.currentTarget.matches(":focus-visible") && clusters.show(key)}
            onClick={() => (open ? clusters.close() : clusters.show(key))}
          />
        );
      })}
    </div>
  );
}

/** "Chicago (CHI): 1 hub, routes to Grand Rapids, Lansing and Detroit." */
function Readout({ zone, zoneById }: { zone: CoverageZone | undefined; zoneById: Map<string, CoverageZone> }) {
  const byCode = useMemo(() => new Map([...zoneById.values()].map((z) => [z.code, z])), [zoneById]);
  if (!zone) return <p aria-hidden="true">Point at a pin or a zone card to trace its routes.</p>;
  const names = zone.routesTo.map((code) => shortName(byCode.get(code)?.name ?? code));
  return (
    <p aria-hidden="true" className="text-ink-foreground">
      <span className="font-bold">{zone.name}</span> ({zone.code}): {hubCount(zone.hubs.length)}
      {names.length ? `, routes to ${listNames(names)}.` : ". Not on the route map yet."}
    </p>
  );
}

const routesLabel = (zone: CoverageZone, zoneById: Map<string, CoverageZone>) => {
  const names = zone.routesTo.map((code) => [...zoneById.values()].find((z) => z.code === code)?.name ?? code);
  return `${zone.name}, ${hubCount(zone.hubs.length)}${names.length ? `, routes to ${listNames(names)}` : ""}. Show its card.`;
};

function ZonePinButton({
  marker,
  zone,
  zoneById,
  onActivate,
  onSelect,
}: {
  marker: MapMarker;
  zone: CoverageZone | undefined;
  zoneById: Map<string, CoverageZone>;
  onActivate: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  if (!zone) return null;
  return (
    <button
      type="button"
      aria-label={routesLabel(zone, zoneById)}
      className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand sm:size-8"
      style={{ left: pct(marker.x, MAP_W), top: pct(marker.y, MAP_H) }}
      onPointerEnter={() => onActivate(zone.id)}
      onPointerLeave={() => onActivate(null)}
      onFocus={() => onActivate(zone.id)}
      onBlur={() => onActivate(null)}
      onClick={() => onSelect(zone.id)}
    />
  );
}

/** Which corner of the map has the fewest other pins (where the inset covers the least). */
function insetCorner(markers: readonly MapMarker[], marker: MapMarker): "tl" | "tr" | "bl" | "br" {
  const corners = [
    { id: "tl", x: [0, 0.42], y: [0, 0.6] },
    { id: "tr", x: [0.58, 1], y: [0, 0.6] },
    { id: "bl", x: [0, 0.42], y: [0.4, 1] },
    { id: "br", x: [0.58, 1], y: [0.4, 1] },
  ] as const;
  const inside = (m: MapMarker, c: (typeof corners)[number]) => m.x / MAP_W >= c.x[0] && m.x / MAP_W <= c.x[1] && m.y / MAP_H >= c.y[0] && m.y / MAP_H <= c.y[1];
  const free = corners.filter((corner) => !inside(marker, corner));
  const count = (corner: (typeof corners)[number]) => markers.filter((m) => inside(m, corner)).length;
  return free.reduce((best, corner) => (count(corner) < count(best) ? corner : best)).id;
}

const CORNER_CLASS = { tl: "sm:top-3 sm:left-3", tr: "sm:top-3 sm:right-3", bl: "sm:bottom-3 sm:left-3", br: "sm:right-3 sm:bottom-3" } as const;

interface ClusterInsetProps {
  id: string;
  marker: MapMarker;
  /** Every marker of the same layout (to find a free corner). */
  markers: readonly MapMarker[];
  routes: CoverageModel["routes"];
  zoneById: Map<string, CoverageZone>;
  open: boolean;
  live: boolean;
  active: string | null;
  onActivate: (id: string | null) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  /** Focus moved to `next` (null: left the page area). */
  onFocusOut: (next: HTMLElement | null) => void;
}

/** Zoomed view of zones too close to tell apart on the national map, with a list of them. */
function ClusterInset({ id, marker, markers, routes, zoneById, open, live, active, onActivate, onSelect, onClose, onPointerEnter, onPointerLeave, onFocusOut }: ClusterInsetProps) {
  const corner = useMemo(() => insetCorner(markers, marker), [markers, marker]);
  const zones = marker.zoneIds.map((zoneId) => zoneById.get(zoneId)).filter((zone): zone is CoverageZone & { pin: NonNullable<CoverageZone["pin"]> } => Boolean(zone?.pin));

  const geometry = useMemo(() => {
    const xs = zones.map((zone) => zone.pin.x);
    const ys = zones.map((zone) => zone.pin.y);
    const pad = 7;
    let [x1, x2, y1, y2] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
    const ratio = 1.6; // 16:10 frame
    if ((x2 - x1) / (y2 - y1) > ratio) {
      const h = (x2 - x1) / ratio;
      [y1, y2] = [(y1 + y2) / 2 - h / 2, (y1 + y2) / 2 + h / 2];
    } else {
      const w = (y2 - y1) * ratio;
      [x1, x2] = [(x1 + x2) / 2 - w / 2, (x1 + x2) / 2 + w / 2];
    }
    const unit = (x2 - x1) / 260; // ~one CSS px at the inset's width
    const sides = placeLabels(
      zones.map((zone) => ({ id: zone.id, x: zone.pin.x - x1, y: zone.pin.y - y1, text: zone.code, r: 6 * unit })),
      x2 - x1,
      y2 - y1,
      12 * unit,
    );
    return { x1, y1, w: x2 - x1, h: y2 - y1, unit, sides };
  }, [zones]);

  const ids = new Set(marker.zoneIds);
  const internal = routes.filter((route) => ids.has(route.from) && ids.has(route.to));
  const { x1, y1, w, h, unit, sides } = geometry;

  return (
    <div
      id={id}
      role="group"
      aria-label={`${marker.label} regional map`}
      hidden={!open}
      onPointerEnter={(event) => event.pointerType === "mouse" && onPointerEnter()}
      onPointerLeave={(event) => event.pointerType === "mouse" && onPointerLeave()}
      onBlur={(event) => onFocusOut(event.relatedTarget as HTMLElement | null)}
      className={cn(
        "z-20 mt-3 w-full rounded-xl bg-ink p-3 text-ink-foreground shadow-raised ring-1 ring-white/15 sm:absolute sm:mt-0 sm:w-[17.5rem]",
        CORNER_CLASS[corner],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">
          {marker.label} <span className="font-normal text-sidebar-muted">{zones.length} zones</span>
        </p>
        <button
          type="button"
          aria-label="Close the regional map"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-full text-sidebar-muted outline-none hover:bg-white/10 hover:text-ink-foreground focus-visible:ring-3 focus-visible:ring-brand"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <svg viewBox={`${x1} ${y1} ${w} ${h}`} aria-hidden="true" className="coverage-net mt-2 aspect-[16/10] w-full rounded-lg bg-white/[0.04]" data-live={live && open ? "" : undefined}>
        <path d={US_OUTLINE_PATH} fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.25" strokeWidth={unit} />
        {internal.map((route) => {
          const a = zoneById.get(route.from)?.pin;
          const b = zoneById.get(route.to)?.pin;
          if (!a || !b) return null;
          const on = active !== null && (route.from === active || route.to === active);
          return (
            <path
              key={route.id}
              data-flow=""
              d={arcPath(a, b, 0.12)}
              fill="none"
              className="stroke-brand"
              strokeOpacity={active !== null && !on ? 0.25 : 0.9}
              strokeWidth={(on ? 2.5 : 1.5) * unit}
              strokeDasharray={`${4 * unit} ${8 * unit}`}
              strokeLinecap="round"
            />
          );
        })}
        {zones.map((zone) => {
          const on = zone.id === active;
          const gap = 9 * unit;
          const { x, y } = zone.pin;
          const side = sides[zone.id] ?? "right";
          const text =
            side === "right"
              ? { x: x + gap, y, dy: "0.35em", textAnchor: "start" as const }
              : side === "left"
                ? { x: x - gap, y, dy: "0.35em", textAnchor: "end" as const }
                : side === "above"
                  ? { x, y: y - gap, dy: "-0.1em", textAnchor: "middle" as const }
                  : { x, y: y + gap, dy: "0.9em", textAnchor: "middle" as const };
          return (
            <g key={zone.id}>
              <circle cx={x} cy={y} r={(on ? 6.5 : 5) * unit} className="fill-ink stroke-brand" strokeWidth={2.5 * unit} />
              <circle cx={x} cy={y} r={2 * unit} className="fill-brand" />
              <text {...text} fontSize={12 * unit} className={cn("font-bold", on ? "fill-brand-text" : "fill-ink-foreground")}>
                {zone.code}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 grid grid-cols-2 gap-1">
        {zones.map((zone) => (
          <li key={zone.id}>
            <button
              type="button"
              onPointerEnter={() => onActivate(zone.id)}
              onPointerLeave={() => onActivate(null)}
              onFocus={() => onActivate(zone.id)}
              onBlur={() => onActivate(null)}
              onClick={() => onSelect(zone.id)}
              aria-label={routesLabel(zone, zoneById)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-brand",
                zone.id === active && "bg-white/10",
              )}
            >
              <span className="font-bold tabular">{zone.code}</span>
              <span className="truncate text-sidebar-muted">{shortName(zone.name)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
