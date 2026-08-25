import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
import { Progress } from "@carbonfree/ui/shadcn/progress";
import { getProjetoCaptacao, listDocumentosProjeto } from "@/lib/queries";
import {
  ROTAS,
  documentosDaRota,
  progressoDocumental,
  type Rota,
  type SituacaoDoc,
} from "@/lib/financiamento";
import { LinhaDocumento } from "./linha-documento";

export const dynamic = "force-dynamic";

const ROTA_PADRAO: Rota = "doacao";

export default async function DocumentosProjetoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rota?: string }>;
}) {
  const { id } = await params;
  const { rota: rotaParam } = await searchParams;
  const projeto = await getProjetoCaptacao(id);
  if (!projeto) notFound();

  const rota = (ROTAS.find((r) => r.value === rotaParam)?.value ?? ROTA_PADRAO) as Rota;
  const rotaInfo = ROTAS.find((r) => r.value === rota)!;

  const registros = await listDocumentosProjeto(id);
  const porDocumento = new Map(registros.map((r) => [r.documentoId, r]));
  const situacoes = new Map<number, SituacaoDoc>(
    registros.map((r) => [r.documentoId, r.situacao]),
  );

  const docs = documentosDaRota(rota);
  const p = progressoDocumental(rota, situacoes);

  return (
    <AppShell active="/financiamento">
      <div className="mb-6">
        <Link
          href={`/financiamento/${id}`}
          className="font-mono text-[11px] text-muted-foreground hover:text-primary"
        >
          ← {projeto.nome}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          Plano de ação documental
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Cada rota de captação exige um conjunto diferente de documentos. Escolha a rota que a
          prefeitura pretende seguir e acompanhe o que já está pronto.
        </p>

        <nav className="mt-4 flex flex-wrap gap-2">
          {ROTAS.map((r) => (
            <Link
              key={r.value}
              href={`/financiamento/${id}/documentos?rota=${r.value}`}
              className={`rounded-sm border px-3 py-1.5 text-[12.5px] transition-colors ${
                r.value === rota
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">{rotaInfo.descricao}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{rotaInfo.label}</CardTitle>
              <CardDescription>
                {docs.length} documentos exigidos nesta rota, do mais crítico ao menos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {docs.map((doc) => {
                const r = porDocumento.get(doc.id);
                return (
                  <LinhaDocumento
                    key={doc.id}
                    projetoId={id}
                    doc={doc}
                    rota={rota}
                    situacao={r?.situacao ?? "pendente"}
                    nomeArquivo={r?.nomeArquivo ?? null}
                    storagePath={r?.storagePath ?? null}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Documentação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums">{p.percentual}%</p>
              <Progress value={p.percentual} className="mt-3 h-1.5" />
              <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">
                {p.prontos} de {p.total} prontos
                {p.emElaboracao > 0 ? ` · ${p.emElaboracao} em elaboração` : ""}
              </p>
              {p.total < docs.length ? (
                <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  {docs.length - p.total} marcado(s) como não aplicável e fora da conta.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {p.criticosPendentes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bloqueia a submissão</CardTitle>
                <CardDescription>
                  Documentos críticos ou obrigatórios ainda não prontos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {p.criticosPendentes.map((d) => (
                    <li key={d.id} className="text-[12.5px]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{d.documento}</span>
                        <Badge variant="outline" className="shrink-0 font-mono text-[9.5px]">
                          {d.prioridade}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{d.responsavel}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sem bloqueios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[12.5px] text-muted-foreground">
                  Todos os documentos críticos e obrigatórios desta rota estão prontos. Confirme
                  as condições e o prazo da chamada na fonte oficial antes de protocolar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
