"use client";

// Client: Recharts measures and draws in the browser.
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps, type TooltipValueType } from "recharts";
import type { Tone } from "@/lib/status";

export interface CategoryPoint {
  /** Axis label (the category's name: identity never relies on colour alone). */
  label: string;
  value: number;
  /** Status tone for the bar (same family as the badges). */
  tone: Tone;
}

interface CategoryBarChartProps {
  data: CategoryPoint[];
  seriesName: string;
  formatValue?: (value: number) => string;
  /** Width reserved for the category labels. */
  labelWidth?: number;
}

const ROW = 30;

function BarTooltip({ active, payload, seriesName, formatValue }: TooltipContentProps<TooltipValueType, string | number> & { seriesName: string; formatValue: (v: number) => string }) {
  const point = payload?.[0]?.payload as CategoryPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-xl bg-popover px-3.5 py-2.5 text-popover-foreground shadow-overlay ring-1 ring-border">
      <p className="text-xs text-muted-foreground">{point.label}</p>
      <p className="text-sm font-bold tabular">
        {seriesName}: {formatValue(point.value)}
      </p>
    </div>
  );
}

/** Horizontal bars, one per category, thin with rounded ends; muted grid; hover tooltip. */
export function CategoryBarChart({ data, seriesName, formatValue = (v) => v.toLocaleString("en-US"), labelWidth = 136 }: CategoryBarChartProps) {
  return (
    <div style={{ height: data.length * ROW + 32 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" strokeDasharray="4 4" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v: number) => formatValue(v)} />
          <YAxis type="category" dataKey="label" width={labelWidth} tickLine={false} axisLine={false} tick={{ fill: "var(--foreground)", fontSize: 12 }} interval={0} />
          <Tooltip cursor={{ fill: "var(--chart-grid)", opacity: 0.35 }} content={(props) => <BarTooltip {...props} seriesName={seriesName} formatValue={formatValue} />} />
          <Bar dataKey="value" name={seriesName} barSize={14} radius={[0, 4, 4, 0]} minPointSize={0} isAnimationActive={false}>
            {data.map((point) => (
              <Cell key={point.label} fill={`var(--tone-${point.tone}-fg)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
