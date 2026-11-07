import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import { AreaHome } from "@/components/layout/area-home";

export const metadata: Metadata = { title: "Operations overview", robots: { index: false } };

export default function AdminHomePage() {
  return (
    <AreaHome
      title="Operations overview"
      description="Shipments, couriers and payments across every zone."
      icon={LayoutDashboard}
      upcoming="Live shipment, revenue and courier figures will appear here."
    />
  );
}
