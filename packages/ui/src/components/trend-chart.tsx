"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendChartProps {
  data: Array<Record<string, number | string>>;
  xKey: string;
  yKey: string;
  color?: string;
  unit?: string;
}

/** Gráfico de série temporal (ex.: intensidade de carbono por período, inventário municipal). */
export function TrendChart({ data, xKey, yKey, color = "#1F6F5C", unit }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#C4CBC3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#5C6B66" }}
          axisLine={{ stroke: "#C4CBC3" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#5C6B66" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toLocaleString("pt-BR")} ${unit ?? ""}`.trim(), ""]}
          contentStyle={{
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            border: "1px solid #C4CBC3",
            borderRadius: 5,
          }}
          labelStyle={{ fontFamily: "Archivo", fontWeight: 700 }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill="url(#trend-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
