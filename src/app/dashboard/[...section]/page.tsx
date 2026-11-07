import type { Metadata } from "next";
import { UpcomingPage } from "@/components/layout/upcoming-page";

// TEMPORARY: placeholder for customer pages from later phases (real pages at the same path win).
export const metadata: Metadata = { title: "Coming soon", robots: { index: false } };

export default function CustomerUpcomingPage({ params }: PageProps<"/dashboard/[...section]">) {
  return <UpcomingPage role="CUSTOMER" params={params} />;
}
