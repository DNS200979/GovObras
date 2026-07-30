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

export default async function PainelPage() {
  const { kpis, balancoMunicipal, distribuicaoFaixas, serieIntensidade, mesaAnalise } = await getPainelData();
  const maxFaixa = Math.max(...distribuicaoFaixas.map((f) => f.obras), 1);
  const saldo = balancoMunicipal.passivo - balancoMunicipal.ativo;
  const totalBalanco = Math.max(balancoMunicipal.passivo, balancoMunicipal.ativo, 1);

  return (
    <AppShell active="/">
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Painel do programa
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Visão geral</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Obras ativas licenciadas</CardDescription>
            <CardTitle className="font-mono text-3xl font-semibold tabular-nums">
              {kpis.obrasAtivas}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dossiês pendentes de análise</CardDescription>
            <CardTitle className="font-mono text-3xl font-semibold tabular-nums">
              {kpis.dossiesPendentes}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selos homologados</CardDescription>
            <CardTitle className="font-mono text-3xl font-semibold tabular-nums">
              {kpis.selosEmitidos}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Intensidade média do setor</CardDescription>
            <CardTitle className="font-mono text-3xl font-semibold tabular-nums">
              {kpis.intensidadeMediaKgM2}
              <span className="ml-1 text-sm font-normal text-muted-foreground">kgCO₂e/m²</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Balanço de carbono municipal</CardTitle>
            <CardDescription>Passivo × ativo agregado das obras em andamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ambar)]">
                  Passivo · emissões
                </p>
                <p className="font-mono text-xl font-semibold text-[var(--color-ambar)]">
                  {fmt(balancoMunicipal.passivo)} <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
                </p>
                <Progress
                  value={(balancoMunicipal.passivo / totalBalanco) * 100}
                  className="mt-2 h-1.5 [&>div]:bg-[var(--color-ambar)]"
                />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  Ativo · remoções
                </p>
                <p className="font-mono text-xl font-semibold text-primary">
                  {fmt(balancoMunicipal.ativo)} <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
                </p>
                <Progress
                  value={(balancoMunicipal.ativo / totalBalanco) * 100}
                  className="mt-2 h-1.5"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md bg-sidebar px-4 py-3 text-sidebar-foreground">
              <div>
                <p className="font-display text-[11px] font-bold uppercase tracking-wider">Saldo líquido</p>
                <p className="mt-0.5 font-mono text-[10px] text-sidebar-foreground/60">
                  Intensidade: {kpis.intensidadeMediaKgM2} kgCO₂e/m² · Meta ≤ 200 (faixa AA)
                </p>
              </div>
              <p className="font-mono text-2xl font-semibold text-[#E8A24E]">
                {fmt(saldo)} <span className="text-xs text-sidebar-foreground/60">tCO₂e</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por faixa do selo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {distribuicaoFaixas.map((f) => (
              <div key={f.faixa} className="flex items-center gap-3">
                <Badge variant={f.tone === "ativo" ? "success" : f.tone === "passivo" ? "warning" : "secondary"} className="w-10 justify-center">
                  {f.faixa}
                </Badge>
                <Progress value={(f.obras / maxFaixa) * 100} className="h-2 flex-1" />
                <span className="w-6 text-right font-mono text-xs text-muted-foreground">{f.obras}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Intensidade líquida do setor por mês</CardTitle>
          <CardDescription>Dado real — cresce conforme novos inventários entram</CardDescription>
        </CardHeader>
        <CardContent>
          {serieIntensidade.length > 1 ? (
            <IntensityTrendChart data={serieIntensidade} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ainda não há histórico suficiente para o gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Mesa de análise</CardTitle>
            <CardDescription>Dossiês aguardando decisão da prefeitura</CardDescription>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {mesaAnalise.length} na fila
          </span>
        </CardHeader>
        <CardContent>
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
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.obra}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{row.alvara}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.construtora}</TableCell>
                  <TableCell className="font-mono">{row.intensidade} kg/m²</TableCell>
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
