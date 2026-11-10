import { cn } from "@/lib/utils";

/**
 * A drawn stand-in for a proof-of-delivery photo: a parcel left on the mat at a front door, framed
 * like a camera shot. Original drawing in theme tokens (no photo, no people).
 */
export function DoorstepPhoto({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      className={cn("block h-auto w-full", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      focusable="false"
    >
      <rect width="240" height="160" className="fill-secondary" />
      {/* Wall siding and step */}
      {[28, 56, 84].map((y) => (
        <path key={y} d={`M0 ${y} H240`} className="stroke-foreground" strokeOpacity="0.07" strokeWidth="2" />
      ))}
      <rect x="0" y="128" width="240" height="32" className="fill-foreground" fillOpacity="0.1" />
      {/* Door with frame, window and handle */}
      <rect x="70" y="10" width="100" height="120" rx="4" className="fill-foreground" fillOpacity="0.16" />
      <rect x="78" y="18" width="84" height="112" rx="3" className="fill-ink" />
      <rect x="92" y="30" width="56" height="26" rx="3" className="fill-ink-foreground" fillOpacity="0.14" />
      <circle cx="150" cy="84" r="4" className="fill-brand" />
      {/* House number plate */}
      <rect x="182" y="40" width="26" height="16" rx="3" className="fill-card" />
      <path d="M189 48 H201" className="stroke-foreground" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      {/* Mat and parcel */}
      <rect x="64" y="128" width="112" height="12" rx="3" className="fill-foreground" fillOpacity="0.22" />
      <path d="M96 94 L126 88 L150 96 L120 102 Z" className="fill-brand" />
      <path d="M96 94 V126 L120 134 V102 Z" className="fill-brand" />
      <path d="M96 94 V126 L120 134 V102 Z" className="fill-ink" fillOpacity="0.28" />
      <path d="M120 102 V134 L150 126 V96 Z" className="fill-brand" fillOpacity="0.85" />
      <path d="M108 91 L138 99 V108" fill="none" className="stroke-ink" strokeOpacity="0.4" strokeWidth="3" />
      <rect x="126" y="110" width="16" height="10" rx="1.5" className="fill-card" transform="rotate(-15 134 115)" />
      {/* Viewfinder corners */}
      <g className="stroke-card" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M12 26 V12 H26" />
        <path d="M214 12 H228 V26" />
        <path d="M12 134 V148 H26" />
        <path d="M214 148 H228 V134" />
      </g>
    </svg>
  );
}
