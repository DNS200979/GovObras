"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ComposicaoItem, FaixaRegua, VersaoInventario } from "@/lib/queries";

/* As cores vêm das variáveis CSS da paleta, então os gráficos acompanham o
   tema claro/escuro sem precisar saber qual está ativo. */
const VERDE = "var(--color-verde)";
const AMBAR = "var(--color-ambar)";
const LINHA = "var(--color-linha)";
const TEXTO_FRACO = "var(--color-texto-fraco)";
const PAPEL = "var(--color-papel)";

const eixo = { fontFamily: "IBM Plex Mono", fontSize: 11, fill: TEXTO_FRACO };

const tooltipStyle = {
  fontFamily: "IBM Plex Mono",
  fontSize: 12,
  background: PAPEL,
  border: `1px solid ${LINHA}`,
  borderRadius: 5,
  color: "var(--color-texto)",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Intensidade por versão do inventário, com as faixas do selo como referência. */
export function EvolucaoIntensidade({
  versoes,
  regua,
}: {
  versoes: VersaoInventario[];
  regua: FaixaRegua[];
}) {
  // As faixas abertas (999999) não viram linha — sujariam a escala.
  const referencias = regua.filter((f) => f.ate_kgco2e_m2 < 10000);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={versoes} margin={{ top: 8, right: 44, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="grad-intensidade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={VERDE} stopOpacity={0.3} />
            <stop offset="95%" stopColor={VERDE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={eixo} axisLine={{ stroke: LINHA }} tickLine={false} />
        <YAxis tick={eixo} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${fmt(v)} kgCO₂e/m²`, "Intensidade"]}
        />
        {referencias.map((f) => (
          <ReferenceLine
            key={f.faixa}
            y={f.ate_kgco2e_m2}
            stroke={LINHA}
            strokeDasharray="4 4"
            label={{ value: f.faixa, position: "right", fontSize: 10, fill: TEXTO_FRACO }}
          />
        ))}
        <Area
          type="monotone"
          dataKey="intensidade"
          stroke={VERDE}
          strokeWidth={2}
          fill="url(#grad-intensidade)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Passivo × ativo lado a lado, por versão. */
export function PassivoAtivoPorVersao({ versoes }: { versoes: VersaoInventario[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={versoes} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
        <XAxis dataKey="label" tick={eixo} axisLine={{ stroke: LINHA }} tickLine={false} />
        <YAxis tick={eixo} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--color-linha)", opacity: 0.25 }}
          formatter={(v: number, n: string) => [`${fmt(v)} tCO₂e`, n === "passivo" ? "Passivo" : "Ativo"]}
        />
        <Bar dataKey="passivo" fill={AMBAR} radius={[3, 3, 0, 0]} />
        <Bar dataKey="ativo" fill={VERDE} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Composição de uma natureza (passivo ou ativo) na versão vigente. */
export function Composicao({ itens, cor }: { itens: ComposicaoItem[]; cor: "passivo" | "ativo" }) {
  const base = cor === "passivo" ? AMBAR : VERDE;
  const total = itens.reduce((s, i) => s + i.tco2e, 0);

  if (total === 0) {
    return <p className="py-10 text-center text-[13px] text-texto-fraco">Sem lançamentos nesta versão.</p>;
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="45%" height={168}>
        <PieChart>
          <Pie
            data={itens}
            dataKey="tco2e"
            nameKey="modulo"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={2}
            stroke="none"
          >
            {itens.map((item, i) => (
              // Mesma cor-base com opacidade decrescente: mantém a leitura
              // "isto é passivo/ativo" sem inventar uma paleta nova.
              <Cell key={item.item} fill={base} fillOpacity={1 - i * (0.6 / Math.max(itens.length, 1))} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${fmt(v)} tCO₂e`, ""]} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 space-y-1.5">
        {itens.map((item, i) => (
          <li key={item.item} className="flex items-baseline gap-2 text-[12px]">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: base, opacity: 1 - i * (0.6 / Math.max(itens.length, 1)) }}
            />
            <span className="min-w-0 flex-1 truncate text-texto-fraco">{item.item}</span>
            <span className="shrink-0 font-mono tabular-nums text-texto">{fmt(item.tco2e)}</span>
            <span className="w-9 shrink-0 text-right font-mono text-[10.5px] text-texto-fraco">
              {Math.round((item.tco2e / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
