import { AppShell } from "@carbonfree/ui/app-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { CarbonBalanceBar } from "@carbonfree/ui/carbon-balance-bar";
import { KpiTile } from "@carbonfree/ui/kpi-tile";
import { TrendChart } from "@carbonfree/ui/trend-chart";
import { obraNav } from "@/lib/nav";
import { balanco, obraAtual, projecaoFechamento } from "@/lib/mock-data";

export default function PainelPage() {
  const intensidadeAtual = projecaoFechamento[1].intensidade;

  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/")}
    >
      <div className="mb-8">
        <CardEyebrow>{obraAtual.fase} · {obraAtual.areaM2.toLocaleString("pt-BR")} m²</CardEyebrow>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ardosia">
          {obraAtual.nome}
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile
          label="Intensidade acumulada"
          value={String(intensidadeAtual)}
          unit="kgCO₂e/m²"
          delta={{ value: "abaixo da meta", positive: true }}
        />
        <KpiTile label="Meta municipal" value="200" unit="kgCO₂e/m² máx." />
        <KpiTile label="Passivo lançado" value={balanco.passivo.toLocaleString("pt-BR")} unit="tCO₂e" />
        <KpiTile label="Ativo reconhecido" value={balanco.ativo.toLocaleString("pt-BR")} unit="tCO₂e" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CarbonBalanceBar
            passivo={balanco.passivo}
            ativo={balanco.ativo}
            intensidade={`${intensidadeAtual} kgCO₂e/m²`}
            meta={obraAtual.faixaAlvo}
          />
        </div>
        <Card className="lg:col-span-2">
          <CardTitle>Projeção de fechamento</CardTitle>
          <TrendChart data={projecaoFechamento} xKey="fase" yKey="intensidade" color="#B4661A" unit="kg/m²" />
        </Card>
      </div>

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <CardTitle className="mb-0">Simulador de decisão</CardTitle>
          <a href="/simulador" className="font-mono text-[11px] text-verde hover:underline">
            abrir em tela cheia →
          </a>
        </div>
        <p className="mb-4 text-[13.5px] text-texto-fraco">
          Compare alternativas de material por R$ investido por tCO₂e evitado — a tela usada antes
          de comprar.
        </p>
        <a
          href="/simulador"
          className="inline-flex items-center rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
        >
          Ir para o simulador
        </a>
      </Card>
    </AppShell>
  );
}
