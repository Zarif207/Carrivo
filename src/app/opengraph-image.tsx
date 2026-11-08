import { ImageResponse } from "next/og";

// Default Open Graph / social card for every page (pages can override with their own).
export const alt = "Carrivo: door-to-door delivery, tracked at every stop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#191817", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: "#f05a16", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#191817" }} />
            </div>
          </div>
          <div style={{ color: "#f7f7f6", fontSize: 44, fontWeight: 800 }}>Carrivo</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ color: "#f7f7f6", fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>Door-to-door delivery, tracked at every stop.</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ background: "#f05a16", color: "#191817", borderRadius: 999, padding: "14px 30px", fontSize: 30, fontWeight: 700 }}>Send a parcel</div>
            <div style={{ color: "#a6a29c", fontSize: 30, display: "flex", alignItems: "center" }}>Standard, Express and Same day</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
