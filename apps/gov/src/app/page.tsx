import { Award, Building2, ClipboardList, TrendingDown, TrendingUp, Gauge } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IntensityTrendChart } from "@/components/intensity-trend-chart";
import { getPainelData } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const riscoVariant = { baixo: "success", medio: "secondary", alto: "warning" } as const;

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  protocolado: "Protocolado",
  em_analise: "Em análise",
  homologado: "Homologado",
  rejeitado: "Rejeitado",
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function KpiTile({
  icon: Icon,
  label,
  value,
  unit,
  accent,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
  accent: string;
  delta?: { value: string; positive: boolean };
}) {
  return (
    <Card className="relative gap-2 overflow-hidden py-4">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <CardHeader className="px-4">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] tracking-wide uppercase">{label}</CardDescription>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[28px] leading-none font-semibold tabular-nums">{value}</span>
          {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        </div>
        {delta ? (
          <div
            className={cn(
              "mt-2 flex items-center gap-1 font-mono text-[11px] tabular-nums",
              delta.positive ? "text-primary" : "text-[var(--color-ambar)]",
            )}
          >
            {delta.positive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {delta.value}
          </div>
        ) : (
          <div className="mt-2 h-[15px]" />
        )}
      </CardContent>
    </Card>
  );
}

export default async function PainelPage() {
  const { kpis, balancoMunicipal, distribuicaoFaixas, serieIntensidade, mesaAnalise } = await getPainelData();
  const maxFaixa = Math.max(...distribuicaoFaixas.map((f) => f.obras), 1);
  const saldo = balancoMunicipal.passivo - balancoMunicipal.ativo;
  const totalBalanco = Math.max(balancoMunicipal.passivo, balancoMunicipal.ativo, 1);

  const primeiraIntensidade = serieIntensidade.at(0)?.intensidade;
  const ultimaIntensidade = serieIntensidade.at(-1)?.intensidade;
  const deltaIntensidade =
    serieIntensidade.length > 1 && primeiraIntensidade
      ? Math.round(((ultimaIntensidade! - primeiraIntensidade) / primeiraIntensidade) * 100)
      : null;

  return (
    <AppShell active="/">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Painel do programa
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Visão geral</h1>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">Florianópolis · SC</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon={Building2} label="Obras ativas" value={String(kpis.obrasAtivas)} accent="var(--chart-3)" />
        <KpiTile
          icon={ClipboardList}
          label="Dossiês pendentes"
          value={String(kpis.dossiesPendentes)}
          accent="var(--color-ambar)"
        />
        <KpiTile icon={Award} label="Selos homologados" value={String(kpis.selosEmitidos)} accent="var(--primary)" />
        <KpiTile
          icon={Gauge}
          label="Intensidade média"
          value={String(kpis.intensidadeMediaKgM2)}
          unit="kgCO₂e/m²"
          accent="var(--chart-2)"
          delta={
            deltaIntensidade !== null
              ? { value: `${Math.abs(deltaIntensidade)}% no período`, positive: deltaIntensidade < 0 }
              : undefined
          }
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3 gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">Balanço de carbono municipal</CardTitle>
            <CardDescription>Passivo × ativo agregado das obras em andamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ambar)]">
                  Passivo · emissões
                </p>
                <p className="font-mono text-lg font-semibold tabular-nums text-[var(--color-ambar)]">
                  {fmt(balancoMunicipal.passivo)} <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
                </p>
                <Progress
                  value={(balancoMunicipal.passivo / totalBalanco) * 100}
                  className="mt-2 h-1 [&>div]:bg-[var(--color-ambar)]"
                />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  Ativo · remoções
                </p>
                <p className="font-mono text-lg font-semibold tabular-nums text-primary">
                  {fmt(balancoMunicipal.ativo)} <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
                </p>
                <Progress value={(balancoMunicipal.ativo / totalBalanco) * 100} className="mt-2 h-1" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="font-display text-[11px] font-bold uppercase tracking-wider">Saldo líquido</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  Intensidade: {kpis.intensidadeMediaKgM2} kgCO₂e/m² · Meta ≤ 200 (faixa AA)
                </p>
              </div>
              <p className="font-mono text-xl font-semibold tabular-nums text-[var(--color-ambar)]">
                {fmt(saldo)} <span className="text-xs text-muted-foreground">tCO₂e</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">Distribuição por faixa do selo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 px-4">
            {distribuicaoFaixas.map((f) => (
              <div key={f.faixa} className="flex items-center gap-3">
                <Badge variant={f.tone === "ativo" ? "success" : f.tone === "passivo" ? "warning" : "secondary"} className="w-10 justify-center">
                  {f.faixa}
                </Badge>
                <Progress value={(f.obras / maxFaixa) * 100} className="h-1.5 flex-1" />
                <span className="w-6 text-right font-mono text-xs tabular-nums text-muted-foreground">{f.obras}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-sm">Intensidade líquida do setor por mês</CardTitle>
          <CardDescription>Dado real — cresce conforme novos inventários entram</CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          {serieIntensidade.length > 1 ? (
            <IntensityTrendChart data={serieIntensidade} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ainda não há histórico suficiente para o gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4">
          <div>
            <CardTitle className="text-sm">Mesa de análise</CardTitle>
            <CardDescription>Dossiês aguardando decisão da prefeitura</CardDescription>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {mesaAnalise.length} na fila
          </span>
        </CardHeader>
        <CardContent className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Construtora</TableHead>
                <TableHead>Intensidade</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mesaAnalise.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="font-medium">{row.obra}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{row.alvara}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.construtora}</TableCell>
                  <TableCell className="font-mono tabular-nums">{row.intensidade} kg/m²</TableCell>
                  <TableCell>
                    <Badge variant={riscoVariant[row.risco]}>{row.risco}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{row.atualizado}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "em_analise" ? "secondary" : "outline"}>
                      {statusLabel[row.status] ?? row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {mesaAnalise.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum dossiê pendente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
