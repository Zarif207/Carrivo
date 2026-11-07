import { Bike } from "lucide-react";
import type { Metadata } from "next";
import { AreaHome } from "@/components/layout/area-home";

export const metadata: Metadata = { title: "Active tasks", robots: { index: false } };

export default function CourierHomePage() {
  return (
    <AreaHome
      title="Active tasks"
      description="Pickups and deliveries assigned to you."
      icon={Bike}
      upcoming="Your active pickups, deliveries and earnings will appear here."
    />
  );
}
