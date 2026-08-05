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

/**
 * Gráfico de série temporal (ex.: intensidade de carbono por período).
 * Grade, eixos e tooltip usam as variáveis da paleta para acompanhar o
 * tema claro/escuro sem precisar saber qual está ativo.
 */
export function TrendChart({ data, xKey, yKey, color = "var(--color-verde)", unit }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-linha)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "var(--color-texto-fraco)" }}
          axisLine={{ stroke: "var(--color-linha)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "var(--color-texto-fraco)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toLocaleString("pt-BR")} ${unit ?? ""}`.trim(), ""]}
          contentStyle={{
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            background: "var(--color-papel)",
            border: "1px solid var(--color-linha)",
            borderRadius: 5,
            color: "var(--color-texto)",
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
