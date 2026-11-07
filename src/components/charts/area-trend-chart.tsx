"use client";

// Client: Recharts measures and draws in the browser. Import it with next/dynamic on pages
// where it sits below the fold so it stays out of the first bundle.
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";

type ChartTooltipProps = TooltipContentProps<TooltipValueType, string | number>;

export interface TrendPoint {
  /** Axis label, e.g. "6 Nov". */
  label: string;
  value: number;
}

interface AreaTrendChartProps {
  data: TrendPoint[];
  /** Tooltip and axis formatting, e.g. formatMoney or formatCount. */
  formatValue?: (value: number) => string;
  /** Name shown in the tooltip, e.g. "Shipments". */
  seriesName: string;
  height?: number;
}

function TrendTooltip({ active, payload, label, formatValue, seriesName }: ChartTooltipProps & { formatValue: (v: number) => string; seriesName: string }) {
  const point = payload?.[0];
  if (!active || !point || typeof point.value !== "number") return null;
  return (
    <div className="rounded-xl bg-popover px-3.5 py-2.5 text-popover-foreground shadow-overlay ring-1 ring-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold tabular">
        {seriesName}: {formatValue(point.value)}
      </p>
    </div>
  );
}

/** Orange line with a soft gradient fill, muted grid and a rounded tooltip. Colours come from CSS tokens. */
export function AreaTrendChart({ data, formatValue = (v) => v.toLocaleString("en-US"), seriesName, height = 240 }: AreaTrendChartProps) {
  const gradientId = `trend-${useId().replace(/:/g, "")}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            allowDecimals={false}
            tickFormatter={(v: number) => formatValue(v)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 2 }}
            content={(props: ChartTooltipProps) => <TrendTooltip {...props} formatValue={formatValue} seriesName={seriesName} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={seriesName}
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
