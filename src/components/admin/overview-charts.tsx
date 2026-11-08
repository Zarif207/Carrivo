"use client";

// Client: Recharts plus a local 7/14/30-day view switch (dashboard-stats has no date filter, so it slices
// the 30 days the API returns instead of refetching). Bar charts below the fold load lazily.
import dynamic from "next/dynamic";
import { useState } from "react";
import { AreaTrendChart, type TrendPoint } from "@/components/charts/area-trend-chart";
import type { CategoryPoint } from "@/components/charts/category-bar-chart";
import { ChartCard } from "@/components/shared/chart-card";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_TIME_ZONE_NAME, formatCount } from "@/lib/format";

const CategoryBarChart = dynamic(() => import("@/components/charts/category-bar-chart").then((m) => m.CategoryBarChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-lg" />,
});

const WINDOWS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
] as const;
type Window = (typeof WINDOWS)[number]["value"];

export function ShipmentsPerDayCard({ points }: { points: TrendPoint[] }) {
  const [window, setWindow] = useState<Window>("30");
  const shown = points.slice(-Number(window));
  const total = shown.reduce((sum, p) => sum + p.value, 0);
  return (
    <ChartCard
      title="Shipments booked per day"
      description={`Last ${window} days, ${BUSINESS_TIME_ZONE_NAME}`}
      value={formatCount(total)}
      action={<SegmentedControl options={WINDOWS} value={window} onValueChange={setWindow} label="Days shown" size="sm" />}
      summary={`${formatCount(total)} shipments booked in the last ${window} days.`}
    >
      <AreaTrendChart data={shown} seriesName="Shipments" formatValue={formatCount} height={260} />
    </ChartCard>
  );
}

export function BreakdownCard({ title, description, points, seriesName, footer }: { title: string; description: string; points: CategoryPoint[]; seriesName: string; footer?: React.ReactNode }) {
  const total = points.reduce((sum, p) => sum + p.value, 0);
  return (
    <ChartCard
      title={title}
      description={description}
      value={formatCount(total)}
      summary={points.map((p) => `${p.label}: ${formatCount(p.value)}`).join(", ")}
      footer={footer}
    >
      <CategoryBarChart data={points} seriesName={seriesName} formatValue={formatCount} />
    </ChartCard>
  );
}
