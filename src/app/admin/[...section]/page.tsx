import type { Metadata } from "next";
import { UpcomingPage } from "@/components/layout/upcoming-page";

// TEMPORARY: placeholder for admin pages from later phases (real pages at the same path win).
export const metadata: Metadata = { title: "Coming soon", robots: { index: false } };

export default function AdminUpcomingPage({ params }: PageProps<"/admin/[...section]">) {
  return <UpcomingPage role="ADMIN" params={params} />;
}
