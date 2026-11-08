import type { MetadataRoute } from "next";

/** Web app manifest: home-screen name and the icon set generated from the Carrivo logo mark. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carrivo",
    short_name: "Carrivo",
    description: "Book a courier, pay online and follow every parcel from pickup to doorstep.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f6",
    theme_color: "#f05a16",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
