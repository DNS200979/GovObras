"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  intensidade: {
    label: "Intensidade líquida",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function IntensityTrendChart({ data }: { data: Array<{ mes: string; intensidade: number }> }) {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-intensidade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-intensidade)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-intensidade)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} fontFamily="var(--font-mono)" fontSize={11} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          fontFamily="var(--font-mono)"
          fontSize={11}
          unit=" kg"
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="intensidade"
          type="monotone"
          fill="url(#fill-intensidade)"
          stroke="var(--color-intensidade)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
