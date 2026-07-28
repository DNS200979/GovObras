import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { CarbonBalanceBar } from "@carbonfree/ui/carbon-balance-bar";
import { KpiTile } from "@carbonfree/ui/kpi-tile";
import { TrendChart } from "@carbonfree/ui/trend-chart";
import { govNav } from "@/lib/nav";
import {
  balancoMunicipal,
  distribuicaoFaixas,
  kpis,
  mesaAnalise,
  riscoTone,
  serieIntensidade,
  statusLabel,
} from "@/lib/mock-data";

export default function PainelPage() {
  return (
    <AppShell productName="CARBONFREE GOV" productTag="Prefeitura · Secretarias" nav={govNav("/")}>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <CardEyebrow>Painel do programa</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ardosia">
            Visão geral
          </h1>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Obras ativas licenciadas" value={String(kpis.obrasAtivas)} />
        <KpiTile
          label="Dossiês pendentes de análise"
          value={String(kpis.dossiesPendentes)}
          delta={{ value: "2 vencendo hoje", positive: false }}
        />
        <KpiTile label="Selos homologados" value={String(kpis.selosEmitidos)} />
        <KpiTile
          label="Intensidade média do setor"
          value={String(kpis.intensidadeMediaKgM2)}
          unit="kgCO₂e/m²"
          delta={{ value: "-14% em 6 meses", positive: true }}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CarbonBalanceBar
            passivo={balancoMunicipal.passivo}
            ativo={balancoMunicipal.ativo}
            intensidade={`${kpis.intensidadeMediaKgM2} kgCO₂e/m²`}
            meta="≤ 200 (faixa B)"
          />
        </div>
        <Card className="lg:col-span-2">
          <CardTitle>Distribuição por faixa do selo</CardTitle>
          <ul className="space-y-2.5">
            {distribuicaoFaixas.map((f) => (
              <li key={f.faixa} className="flex items-center gap-3">
                <Badge tone={f.tone} className="w-9 justify-center">
                  {f.faixa}
                </Badge>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-concreto">
                  <div
                    className="h-full rounded-full bg-ardosia-2"
                    style={{ width: `${(f.obras / 14) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-xs text-texto-fraco">
                  {f.obras}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-8">
        <CardTitle>Intensidade média do setor — últimos 7 meses</CardTitle>
        <TrendChart data={serieIntensidade} xKey="mes" yKey="intensidade" unit="kgCO₂e/m²" />
      </Card>

      <Card id="mesa-analise">
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0">Mesa de análise</CardTitle>
          <span className="font-mono text-[11px] text-texto-fraco">
            {mesaAnalise.length} dossiês na fila
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-linha text-[11px] uppercase tracking-wide text-texto-fraco">
                <th className="py-2 pr-3 font-display font-bold">Obra</th>
                <th className="py-2 pr-3 font-display font-bold">Construtora</th>
                <th className="py-2 pr-3 font-display font-bold">Intensidade</th>
                <th className="py-2 pr-3 font-display font-bold">Risco</th>
                <th className="py-2 pr-3 font-display font-bold">Prazo</th>
                <th className="py-2 font-display font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {mesaAnalise.map((row) => (
                <tr key={row.id} className="border-b border-linha/60 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-texto">{row.obra}</div>
                    <div className="font-mono text-[11px] text-texto-fraco">{row.id}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-texto-fraco">{row.construtora}</td>
                  <td className="py-2.5 pr-3 font-mono">{row.intensidade} kg/m²</td>
                  <td className="py-2.5 pr-3">
                    <Badge tone={riscoTone[row.risco]}>{row.risco}</Badge>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-texto-fraco">{row.prazo}</td>
                  <td className="py-2.5">
                    <Badge tone={row.status === "pendencia" ? "passivo" : "default"}>
                      {statusLabel[row.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
