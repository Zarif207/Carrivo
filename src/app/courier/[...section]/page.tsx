import type { Metadata } from "next";
import { UpcomingPage } from "@/components/layout/upcoming-page";

// TEMPORARY: placeholder for courier pages from later phases (real pages at the same path win).
export const metadata: Metadata = { title: "Coming soon", robots: { index: false } };

export default function CourierUpcomingPage({ params }: PageProps<"/courier/[...section]">) {
  return <UpcomingPage role="COURIER" params={params} />;
}
