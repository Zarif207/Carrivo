/**
 * A courier on a scooter with a parcel on the rack, drawn around its road contact point (0, 0),
 * facing right. Original geometric drawing for ink panels (tokens only). Shared by the hero's route
 * and the courier campaign; the caller positions it (and GSAP may move the caller's group).
 */
export function CourierRider() {
  return (
    <>
      {/* Parcel on the rear rack */}
      <rect x="-27" y="-31" width="17" height="15" rx="2.5" className="fill-brand" />
      <path d="M-18.5 -31 V-16" className="stroke-ink" strokeOpacity="0.5" strokeWidth="2" />
      {/* Frame: deck, rear guard and steering column */}
      <path d="M-23 -13 H7 L15 -31" fill="none" className="stroke-ink-foreground" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 -33 H20" className="stroke-ink-foreground" strokeWidth="3.5" strokeLinecap="round" />
      {/* Rider: leg, body, arm, helmet */}
      <path d="M-8 -15 L-3 -26" className="stroke-ink-foreground" strokeWidth="5" strokeLinecap="round" />
      <path d="M-3 -26 L1 -40" className="stroke-ink-foreground" strokeWidth="6.5" strokeLinecap="round" />
      <path d="M0 -36 L13 -32" className="stroke-ink-foreground" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="3" cy="-47" r="6.5" className="fill-brand" />
      <path d="M5 -50 H10" className="stroke-ink" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      {/* Wheels */}
      {[-17, 15].map((cx) => (
        <circle key={cx} cx={cx} cy="-6.5" r="6.5" className="fill-ink stroke-ink-foreground" strokeWidth="3" />
      ))}
    </>
  );
}
