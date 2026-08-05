import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { CarbonBalanceBar } from "@carbonfree/ui/carbon-balance-bar";
import { KpiTile } from "@carbonfree/ui/kpi-tile";
import { TrendChart } from "@carbonfree/ui/trend-chart";
import { getObraAtual } from "@/lib/queries";

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const { obra, balanco, projecaoFechamento } = await getObraAtual();
  const atual = projecaoFechamento.at(-1);
  const intensidadeAtual = atual?.intensidade ?? 0;

  return (
    <ObraShell active="/painel">
      <div className="mb-8">
        <CardEyebrow>
          {faseLabel[obra.fase] ?? obra.fase} · {obra.areaM2.toLocaleString("pt-BR")} m²
        </CardEyebrow>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
          {obra.nome}
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Intensidade acumulada" value={String(intensidadeAtual)} unit="kgCO₂e/m²" />
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
            meta={obra.faixaAlvo}
          />
        </div>
        <Card className="lg:col-span-2">
          <CardTitle>Histórico de inventário (dado real)</CardTitle>
          {projecaoFechamento.length > 1 ? (
            <TrendChart
              data={projecaoFechamento}
              xKey="fase"
              yKey="intensidade"
              color="var(--color-ambar)"
              unit="kg/m²"
            />
          ) : (
            <p className="py-8 text-center text-[13px] text-texto-fraco">
              Só existe um inventário até agora — o histórico aparece a partir da segunda versão.
            </p>
          )}
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
    </ObraShell>
  );
}
