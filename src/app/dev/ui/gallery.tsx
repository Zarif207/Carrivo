"use client";

// TEMPORARY (Phase 1): interactive gallery for /dev/ui. Client because it hosts forms, dialogs and URL state.
import { zodResolver } from "@hookform/resolvers/zod";
import { Bike, CircleDollarSign, Package, PackageCheck, PackageSearch, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { ChartCard } from "@/components/shared/chart-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckboxField, NumberField, SelectField, SwitchField, TextareaField, TextField } from "@/components/shared/form-fields";
import { Logo } from "@/components/shared/logo";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TimeRangeSwitcher } from "@/components/shared/time-range-switcher";
import { Timeline, fromStatusHistory, fromTrackingTimeline } from "@/components/shared/timeline";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { formatCount, formatDate, formatMoney } from "@/lib/format";
import { timeRangeToDates } from "@/lib/time-range";
import { PAYMENT_STATUSES, SERVICE_TYPES, SHIPMENT_PAYMENT_STATUSES, SHIPMENT_STATUSES, type ShipmentListItem } from "@/types";
import { SAMPLE_HISTORY, SAMPLE_SHIPMENTS, SAMPLE_SHIPMENTS_PER_DAY, SAMPLE_TRACKING } from "./sample-data";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

const SWATCHES = [
  ["Brand orange", "bg-brand"],
  ["Orange text", "bg-brand-text"],
  ["Ink", "bg-ink"],
  ["Background", "bg-background"],
  ["Card", "bg-card"],
  ["Surface", "bg-surface"],
  ["Border", "bg-border"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Danger", "bg-danger"],
  ["Info", "bg-info"],
  ["Sidebar", "bg-sidebar"],
] as const;

const VIEW_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function SegmentedDemo() {
  const [view, setView] = useState<(typeof VIEW_OPTIONS)[number]["value"]>("active");
  return <SegmentedControl options={VIEW_OPTIONS} value={view} onValueChange={setView} label="Shipment view" />;
}

const columns: DataTableColumn<ShipmentListItem>[] = [
  {
    id: "tracking",
    header: "Tracking id",
    sortKey: "trackingId",
    cell: (row) => (
      <Link href="#" className="font-id font-semibold underline-offset-4 hover:underline">
        {row.trackingId}
      </Link>
    ),
  },
  { id: "receiver", header: "Receiver", cell: (row) => row.receiverName },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <StatusBadge kind="shipment" status={row.status} size="sm" /> },
  { id: "price", header: "Price", sortKey: "price", align: "right", cell: (row) => <span className="tabular">{formatMoney(row.price)}</span> },
  { id: "created", header: "Booked", sortKey: "createdAt", cell: (row) => formatDate(row.createdAt) },
];

const demoSchema = z.object({
  receiverName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  receiverPhone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, "Phone must be 7-20 digits, optionally with +, spaces or dashes"),
  weightKg: z.number({ error: "Enter the weight in kg" }).positive("Weight must be greater than 0").max(1000),
  serviceType: z.enum(SERVICE_TYPES, { error: "Choose a service" }),
  description: z.string().trim().max(500).optional(),
  isFragile: z.boolean(),
  confirm: z.boolean().refine((value) => value, "Confirm the details before booking"),
});

type DemoValues = z.input<typeof demoSchema>;

function DemoForm() {
  const form = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: { receiverName: "", receiverPhone: "", weightKg: undefined, description: "", isFragile: false, confirm: false },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => toast.success("Form is valid"))} className="grid gap-5 rounded-xl bg-card p-5 ring-1 ring-border sm:grid-cols-2" noValidate>
        <TextField control={form.control} name="receiverName" label="Receiver name" autoComplete="name" />
        <TextField control={form.control} name="receiverPhone" label="Receiver phone" type="tel" inputMode="tel" placeholder="+8801711000000" />
        <NumberField control={form.control} name="weightKg" label="Weight" suffix="kg" step="0.01" min={0} />
        <SelectField
          control={form.control}
          name="serviceType"
          label="Service"
          options={[
            { value: "STANDARD", label: "Standard" },
            { value: "EXPRESS", label: "Express" },
            { value: "SAME_DAY", label: "Same day" },
          ]}
        />
        <TextareaField control={form.control} name="description" label="What's inside" optional className="sm:col-span-2" maxLength={500} />
        <SwitchField control={form.control} name="isFragile" label="Fragile" description="The courier will handle it with extra care." className="sm:col-span-2" />
        <CheckboxField control={form.control} name="confirm" label="The details are correct" className="sm:col-span-2" />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">Check form</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function Gallery({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className="space-y-10 px-4 py-8 sm:px-6">
      <PageHeader
        title={theme === "light" ? "Light theme" : "Dark theme"}
        description="Shared components as they appear in the product."
        back={{ href: "/", label: "Back to site" }}
        actions={
          <>
            <ThemeToggle />
            <Button variant="signal">
              <Plus /> New shipment
            </Button>
          </>
        }
      />

      <Section title="Brand and type">
        <div className="flex flex-wrap items-center gap-6">
          <Logo href={null} />
          <div className="rounded-lg bg-sidebar p-3">
            <Logo href={null} tone="inverse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SWATCHES.map(([name, className]) => (
            <div key={name} className="space-y-1.5">
              <div className={`h-12 rounded-lg ring-1 ring-border ${className}`} />
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="font-display text-display-1">Parcels, tracked.</p>
          <p className="font-display text-display-2">Dhaka North to South</p>
          <p className="font-display text-display-3">Out for delivery</p>
          <p className="max-w-prose">
            Body text in Open Sans. Tracking ids and phones use the monospace face:{" "}
            <span className="font-id font-semibold">CRV-261101-SEED05</span>, <span className="font-id">+8801711000001</span>. Money uses tabular
            figures: <span className="tabular">$6.00</span>, <span className="tabular">$142.50</span>.
          </p>
          <p className="text-sm text-muted-foreground">Muted text for hints and secondary details.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Pay $6.00</Button>
          <Button variant="signal">Send a parcel</Button>
          <Button variant="secondary">Schedule pickup</Button>
          <Button variant="outline">Download receipt</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive">Cancel shipment</Button>
          <Button variant="link">View details</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
        </div>
      </Section>

      <Section title="Status badges">
        <p className="text-sm text-muted-foreground">Shipment status</p>
        <div className="flex flex-wrap gap-2">
          {SHIPMENT_STATUSES.map((status) => (
            <StatusBadge key={status} kind="shipment" status={status} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Payment status</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((status) => (
            <StatusBadge key={status} kind="payment" status={status} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Shipment payment status (small)</p>
        <div className="flex flex-wrap gap-2">
          {SHIPMENT_PAYMENT_STATUSES.map((status) => (
            <StatusBadge key={status} kind="shipment-payment" status={status} size="sm" />
          ))}
        </div>
      </Section>

      <Section title="Segmented controls">
        <div className="flex flex-col items-start gap-3">
          <TimeRangeSwitcher />
          <TimeRangeSwitcher size="sm" />
          <SegmentedDemo />
          <p className="text-sm text-muted-foreground">
            The time range writes <span className="font-id">?range=</span>. On 7 Nov 2026, &ldquo;This week&rdquo; maps to{" "}
            <span className="font-id">{JSON.stringify(timeRangeToDates("week", new Date("2026-11-07T06:00:00Z")))}</span> for API filters.
          </p>
        </div>
      </Section>

      <Section title="Chart card">
        <ChartCard
          title="Shipments per day"
          description="Last 14 days"
          value={formatCount(SAMPLE_SHIPMENTS_PER_DAY.reduce((sum, d) => sum + d.value, 0))}
          action={<TimeRangeSwitcher size="sm" />}
          summary="Shipments per day over the last 14 days, peaking at 9 on 31 Oct."
          footer="Counts include every status, including cancelled shipments."
        >
          <AreaTrendChart data={SAMPLE_SHIPMENTS_PER_DAY} seriesName="Shipments" formatValue={formatCount} />
        </ChartCard>
      </Section>

      <Section title="Stat cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard variant="feature" label="Active shipments" value="7" icon={Package} hint="3 waiting for pickup" />
          <StatCard label="Delivered" value="24" icon={PackageCheck} hint="This month" />
          <StatCard label="Spent" value={formatMoney("142.50")} icon={CircleDollarSign} hint="Across 31 payments" />
          <StatCardSkeleton />
        </div>
      </Section>

      <Section title="Search, table and pagination">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput label="Search shipments" placeholder="Tracking id, receiver or phone" />
          <p className="text-sm text-muted-foreground">Type, then watch the URL update.</p>
        </div>
        <DataTable
          caption="Sample shipments"
          columns={columns}
          data={SAMPLE_SHIPMENTS}
          getRowId={(row) => row.id}
          defaultSort={{ key: "createdAt", order: "desc" }}
          emptyState={null}
          renderMobileCard={(row) => (
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <p className="font-id font-semibold">{row.trackingId}</p>
                <p className="truncate text-sm text-muted-foreground">To {row.receiverName}</p>
                <StatusBadge kind="shipment" status={row.status} size="sm" />
              </div>
              <p className="font-semibold tabular">{formatMoney(row.price)}</p>
            </div>
          )}
        />
        <Pagination meta={{ page: 2, limit: 10, total: 57, totalPages: 6 }} itemLabel="shipments" />
        <p className="text-sm text-muted-foreground">Loading state</p>
        <DataTable caption="Loading shipments" columns={columns} data={undefined} isLoading loadingRows={3} getRowId={(row) => row.id} emptyState={null} />
        <p className="text-sm text-muted-foreground">Empty state</p>
        <DataTable
          caption="No shipments"
          columns={columns}
          data={[]}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              variant="plain"
              icon={PackageSearch}
              title="No shipments match these filters"
              description="Clear the search or pick another status."
              action={<Button variant="outline">Clear filters</Button>}
            />
          }
        />
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Bike}
          title="No active tasks"
          description="New pickups appear here as soon as an admin assigns them to you."
          action={<Button variant="secondary">Refresh</Button>}
        />
      </Section>

      <Section title="Confirm dialog">
        <div className="flex flex-wrap gap-2">
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 /> Cancel shipment
              </Button>
            }
            tone="destructive"
            title="Cancel this shipment?"
            description="CRV-261101-SEED10 hasn't been picked up yet. If you paid, the full amount goes back to your card."
            confirmLabel="Cancel shipment"
            cancelLabel="Keep shipment"
            onConfirm={() =>
              new Promise<void>((resolve) =>
                setTimeout(() => {
                  toast.success("Shipment cancelled");
                  resolve();
                }, 800),
              )
            }
          />
          <ConfirmDialog
            trigger={<Button variant="outline">Mark as available</Button>}
            title="Go available for new tasks?"
            description="Admins will be able to assign new pickups to you."
            confirmLabel="Go available"
            onConfirm={() => toast.success("You're available")}
          />
          <Button variant="outline" onClick={() => toast.error("Shipment can only be edited while it is booked.")}>
            Error toast
          </Button>
        </div>
      </Section>

      <Section title="Form fields">
        <DemoForm />
      </Section>

      <Section title="Timeline">
        <div className="grid gap-6 lg:grid-cols-1">
          <div className="rounded-xl bg-card p-5 ring-1 ring-border">
            <p className="pb-4 text-sm text-muted-foreground">Shipment detail (status history, with upcoming stops)</p>
            <Timeline events={fromStatusHistory(SAMPLE_HISTORY)} showUpcoming />
          </div>
          <div className="rounded-xl bg-card p-5 ring-1 ring-border">
            <p className="pb-4 text-sm text-muted-foreground">Public tracking (cities only)</p>
            <Timeline events={fromTrackingTimeline(SAMPLE_TRACKING)} />
          </div>
        </div>
      </Section>
    </div>
  );
}
