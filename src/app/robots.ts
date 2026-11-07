import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private areas, API routes, personal tracking lookups and the temporary component gallery.
        disallow: ["/dashboard", "/courier", "/admin", "/api/", "/track/", "/shipments/", "/payment/", "/dev/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
