import { Bike, CircleDollarSign, Package, PackageCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { ShellUser } from "@/components/layout/user-menu";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_HOME } from "@/config/nav";
import { formatMoney } from "@/lib/format";
import type { Role } from "@/types";

// TEMPORARY (Phase 1): previews the DashboardShell for each role with sample content.

const USERS: Record<string, ShellUser> = {
  customer: { name: "Ayesha Customer", email: "customer1@carrivo.dev", role: "CUSTOMER" },
  courier: { name: "Rahim Courier", email: "courier1@carrivo.dev", role: "COURIER" },
  admin: { name: "Carrivo Admin", email: "admin@carrivo.dev", role: "ADMIN" },
};

const TITLES: Record<Role, { title: string; description: string }> = {
  CUSTOMER: { title: "Your shipments", description: "Book, pay for and follow your parcels." },
  COURIER: { title: "Active tasks", description: "Pickups and deliveries assigned to you." },
  ADMIN: { title: "Operations overview", description: "Shipments, couriers and payments across every zone." },
};

/** Sample unread counts so the orange badges are visible. */
const SAMPLE_BADGES = { "/dashboard/shipments": 3, "/dashboard/payments": 1, "/courier/earnings": 2, "/admin/payments": 2, "/admin/reports": 4 };

export function generateStaticParams() {
  return Object.keys(USERS).map((role) => ({ role }));
}

// Params are request data under Cache Components: read them inside <Suspense> so navigation stays instant.
export default function ShellPreviewPage({ params }: PageProps<"/dev/ui/shell/[role]">) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[80vh] rounded-xl" />}>
      <ShellPreview params={params} />
    </Suspense>
  );
}

async function ShellPreview({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const user = USERS[role];
  if (!user) notFound();
  const copy = TITLES[user.role];

  return (
    <DashboardShell user={user} currentPath={ROLE_HOME[user.role]} badges={SAMPLE_BADGES}>
      <PageHeader title={copy.title} description={copy.description} actions={<Button variant="signal">Primary action</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard variant="feature" label="Active shipments" value="7" icon={Package} hint="3 waiting for pickup" />
        <StatCard label="Delivered" value="24" icon={PackageCheck} hint="This month" />
        <StatCard label={user.role === "COURIER" ? "Earned" : "Spent"} value={formatMoney("142.50")} icon={CircleDollarSign} />
        <StatCard label={user.role === "ADMIN" ? "Active couriers" : "Out for delivery"} value="2" icon={user.role === "ADMIN" ? Users : Bike} />
      </div>
      <div className="mt-6 h-[60vh] rounded-xl border-2 border-dashed border-border p-6 text-muted-foreground">
        Page content area (tall, to check scrolling, the sticky header and the mobile bottom bar).
      </div>
    </DashboardShell>
  );
}
