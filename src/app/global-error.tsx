"use client";

// Client: replaces the root layout when it fails, so it renders its own <html> and inline styles
// (globals.css and fonts may be what broke).
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f7f6",
          color: "#191817",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Carrivo is having trouble</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: "#66625d", margin: "0 0 24px" }}>
            The site couldn&rsquo;t load. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ height: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#f05a16", color: "#191817", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
