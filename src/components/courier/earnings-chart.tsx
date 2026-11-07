"use client";

// Client: Recharts draws in the browser; this wrapper only passes a formatter (functions can't cross from the server).
import { AreaTrendChart, type TrendPoint } from "@/components/charts/area-trend-chart";
import { formatMoney } from "@/lib/format";

export function EarningsChart({ data }: { data: TrendPoint[] }) {
  return <AreaTrendChart data={data} seriesName="Earned" formatValue={(v) => formatMoney(v)} height={260} />;
}
