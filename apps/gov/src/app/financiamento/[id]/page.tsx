import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProjetoCaptacao } from "@/lib/queries";
import { QUESTOES, SITUACOES, TEMAS } from "@/lib/financiamento";
import { LinhaQuestao } from "./questao";

export const dynamic = "force-dynamic";

const rotulo = (lista: { value: string; label: string }[], v: string) =>
  lista.find((i) => i.value === v)?.label ?? v;

export default async function ProjetoCaptacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projeto = await getProjetoCaptacao(id);
  if (!projeto) notFound();

  const { diagnostico: d } = projeto;
  const porQuestao = new Map(projeto.respostas.map((r) => [r.questaoId, r]));
  const automaticas = projeto.respostas.filter((r) => r.origem === "automatico").length;

  return (
    <AppShell active="/financiamento">
      <div className="mb-6">
        <Link
          href="/financiamento"
          className="font-mono text-[11px] text-muted-foreground hover:text-primary"
        >
          ← Financiamento climático
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {rotulo(TEMAS, projeto.tema)}
              {projeto.valorEstimadoBrl
                ? ` · R$ ${projeto.valorEstimadoBrl.toLocaleString("pt-BR")}`
                : ""}
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
              {projeto.nome}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{rotulo(SITUACOES, projeto.situacao)}</Badge>
            <Link
              href={`/financiamento/oportunidades?projeto=${projeto.id}`}
              className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] transition-colors hover:border-primary/40 hover:text-primary"
            >
              Oportunidades →
            </Link>
            <Link
              href={`/financiamento/${projeto.id}/documentos`}
              className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] transition-colors hover:border-primary/40 hover:text-primary"
            >
              Plano documental →
            </Link>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{projeto.descricao}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Diagnóstico de prontidão</CardTitle>
              <CardDescription>
                {d.respondidas} de {QUESTOES.length} respondidas
                {automaticas > 0
                  ? ` · ${automaticas} preenchida${automaticas === 1 ? "" : "s"} automaticamente pela plataforma`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {QUESTOES.map((q) => {
                const r = porQuestao.get(q.id);
                return (
                  <LinhaQuestao
                    key={q.id}
                    projetoId={projeto.id}
                    questao={q}
                    resposta={r?.resposta ?? null}
                    evidencia={r?.evidencia ?? null}
                    origem={r?.origem ?? null}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prontidão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums">{d.prontidaoPct}%</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{d.classificacao}</p>
              <Progress value={d.prontidaoPct} className="mt-3 h-1.5" />
              <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">
                {d.pontosObtidos} de {d.pontosPossiveis} pontos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rota sugerida</CardTitle>
              <CardDescription>{d.faixa.prioridade}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[12.5px] leading-relaxed">{d.faixa.canais}</p>
              <Link
                href={`/financiamento/oportunidades?projeto=${projeto.id}`}
                className="mt-2 inline-block font-mono text-[11px] text-primary hover:underline"
              >
                ver esses canais no catálogo →
              </Link>
              <p className="mt-3 border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                GCF, GEF e Fundo de Adaptação exigem entidade acreditada e anuência nacional — a
                prefeitura não submete sozinha. Crédito externo passa por COFIEX, análise fiscal e
                autorização legislativa.
              </p>
            </CardContent>
          </Card>

          {d.lacunas.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Onde a pontuação mais cresce</CardTitle>
                <CardDescription>Maiores lacunas primeiro</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {d.lacunas.slice(0, 5).map((q) => (
                    <li key={q.id} className="text-[12.5px]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{q.dimensao}</span>
                        <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                          +{q.peso} pts
                        </span>
                      </div>
                      <p className="text-muted-foreground">{q.proximaAcao}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
