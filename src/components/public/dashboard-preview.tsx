import { CircleDollarSign, CreditCard, LayoutDashboard, Package, PackageCheck, PackagePlus, Plus, Truck } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PREVIEW_SHIPMENTS } from "@/content/preview";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [LayoutDashboard, Package, PackagePlus, CreditCard];

/**
 * A framed picture of the customer dashboard, rendered with the real components and sample values
 * shaped like the API's responses. It is inert (nothing inside can be focused or clicked).
 */
export function DashboardPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <div inert className="rounded-[2rem] bg-ink p-2 shadow-overlay sm:p-2.5">
        <div className="flex gap-2.5">
          {/* Mini sidebar */}
          <div className="hidden w-14 shrink-0 flex-col items-center gap-2 py-3 sm:flex" aria-hidden="true">
            <LogoMark className="mb-3 size-8" />
            {NAV.map((Icon, i) => (
              <span
                key={i}
                className={cn(
                  "grid size-10 place-items-center rounded-full text-sidebar-muted",
                  i === 1 && "bg-sidebar-accent text-sidebar-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
                )}
              >
                <Icon className="size-[1.125rem]" />
              </span>
            ))}
          </div>

          {/* Content panel */}
          <div className="min-w-0 flex-1 space-y-4 rounded-[1.5rem] bg-background p-4 text-foreground sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Customer account</p>
                <p className="text-xl font-extrabold tracking-tight">Your shipments</p>
              </div>
              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-2.5 text-sm font-semibold whitespace-nowrap text-brand-foreground sm:px-3.5">
                <Plus className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">New shipment</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <StatCard variant="feature" label="Active" value="2" icon={Truck} hint="1 out for delivery" size="compact" />
              <StatCard label="Delivered" value="14" icon={PackageCheck} hint="This month" size="compact" />
              <StatCard label="Spent" value={formatMoney("58.75")} icon={CircleDollarSign} hint="This month" size="compact" className="hidden lg:flex" />
            </div>

            <ul className="divide-y divide-border rounded-xl bg-card shadow-card">
              {PREVIEW_SHIPMENTS.map((shipment) => (
                <li key={shipment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-id text-[0.8125rem] font-semibold">{shipment.trackingId}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      To {shipment.receiverName}, {shipment.destinationZone.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge kind="shipment" status={shipment.status} size="sm" />
                    <span className="text-xs font-semibold tabular">{formatMoney(shipment.price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">
        The customer dashboard, shown with sample shipments.
      </figcaption>
    </figure>
  );
}
