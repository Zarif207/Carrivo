import { Package } from "lucide-react";
import type { Metadata } from "next";
import { AreaHome } from "@/components/layout/area-home";

export const metadata: Metadata = { title: "Your shipments", robots: { index: false } };

export default function CustomerHomePage() {
  return (
    <AreaHome
      title="Your shipments"
      description="Book, pay for and track your parcels."
      icon={Package}
      upcoming="Your shipments, payments and notifications will appear here."
      action={{ href: "/pricing", label: "Get a price" }}
    />
  );
}
