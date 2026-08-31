import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
import { getProjetoCaptacao } from "@/lib/queries";
import { FAIXAS, TEMAS } from "@/lib/financiamento";
import {
  ACESSOS,
  ATUALIZACAO_PESQUISA,
  MODALIDADES,
  OPORTUNIDADES,
  SITUACOES_OPORTUNIDADE,
  filtrarOportunidades,
  ordenarPorAderencia,
  type Acesso,
  type Modalidade,
  type SituacaoOportunidade,
} from "@/lib/oportunidades";

export const dynamic = "force-dynamic";

const rotulo = (lista: { value: string; label: string }[], v: string) =>
  lista.find((i) => i.value === v)?.label ?? v;

type Params = {
  projeto?: string;
  modalidade?: string;
  acesso?: string;
  tema?: string;
  situacao?: string;
};

/** Monta a URL preservando os demais filtros; valor igual ao atual desliga. */
function comFiltro(base: Params, chave: keyof Params, valor: string): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
  if (base[chave] === valor) p.delete(chave);
  else p.set(chave, valor);
  const q = p.toString();
  return `/financiamento/oportunidades${q ? `?${q}` : ""}`;
}

function Filtro({
  titulo,
  opcoes,
  chave,
  params,
}: {
  titulo: string;
  opcoes: { value: string; label: string }[];
  chave: keyof Params;
  params: Params;
}) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <Link
            key={o.value}
            href={comFiltro(params, chave, o.value)}
            className={`rounded-sm border px-2 py-1 text-[11.5px] transition-colors ${
              params[chave] === o.value
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  const projeto = params.projeto ? await getProjetoCaptacao(params.projeto) : null;
  const faixa = projeto ? FAIXAS.indexOf(projeto.diagnostico.faixa) : undefined;
  const temaProjeto = projeto?.tema;

  const filtradas = filtrarOportunidades({
    modalidade: params.modalidade as Modalidade | undefined,
    acesso: params.acesso as Acesso | undefined,
    tema: params.tema,
    situacao: params.situacao as SituacaoOportunidade | undefined,
  });
  const lista = ordenarPorAderencia(filtradas, faixa, temaProjeto);

  const algumFiltro = Boolean(
    params.modalidade || params.acesso || params.tema || params.situacao,
  );

  return (
    <AppShell active="/financiamento">
      <div className="mb-6">
        {projeto ? (
          <Link
            href={`/financiamento/${projeto.id}`}
            className="font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            ← {projeto.nome}
          </Link>
        ) : (
          <Link
            href="/financiamento"
            className="font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            ← Financiamento climático
          </Link>
        )}
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          Oportunidades de financiamento
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {OPORTUNIDADES.length} financiadores e programas de preparação. Confirme condições,
          chamadas e contatos na fonte oficial antes de protocolar — os valores são indicativos
          ou de operações anteriores.
        </p>
        <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
          Pesquisa atualizada em {ATUALIZACAO_PESQUISA}
        </p>
      </div>

      {projeto ? (
        <Card className="mb-4 border-primary/40">
          <CardContent>
            <p className="text-[12.5px]">
              Ordenado pela aderência a{" "}
              <span className="font-medium">{projeto.nome}</span> —{" "}
              {projeto.diagnostico.prontidaoPct}% de prontidão (
              {projeto.diagnostico.faixa.prioridade.toLowerCase()}) e tema{" "}
              {rotulo(TEMAS, projeto.tema).toLowerCase()}.
            </p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              A ordem é sugestão de leitura, não elegibilidade: um canal fora do topo pode ser o
              certo, e estar no topo não garante enquadramento.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-4">
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Filtro titulo="Modalidade" opcoes={MODALIDADES} chave="modalidade" params={params} />
          <Filtro titulo="Acesso municipal" opcoes={ACESSOS} chave="acesso" params={params} />
          <Filtro titulo="Tema" opcoes={TEMAS} chave="tema" params={params} />
          <Filtro
            titulo="Situação"
            opcoes={SITUACOES_OPORTUNIDADE}
            chave="situacao"
            params={params}
          />
        </CardContent>
      </Card>

      <p className="mb-3 font-mono text-[11px] text-muted-foreground">
        {lista.length} de {OPORTUNIDADES.length} canais
        {algumFiltro ? (
          <>
            {" · "}
            <Link
              href={`/financiamento/oportunidades${params.projeto ? `?projeto=${params.projeto}` : ""}`}
              className="hover:text-primary"
            >
              limpar filtros
            </Link>
          </>
        ) : null}
      </p>

      {lista.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum canal combina com esses filtros. Afrouxe um critério — cruzar tema com
              modalidade costuma zerar a lista.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {lista.map((o) => {
            const recomendado = faixa !== undefined && o.faixasRecomendadas.includes(faixa);
            const combinaTema = temaProjeto ? o.temas.includes(temaProjeto) : false;
            const encerrada = o.situacao === "chamada_encerrada";

            return (
              <Card key={o.id} className={recomendado ? "border-verde/50" : undefined}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-[15px]">{o.nome}</CardTitle>
                      <CardDescription>
                        {o.natureza} · {o.abrangencia}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {recomendado ? (
                        <Badge className="bg-verde text-ardosia">recomendado agora</Badge>
                      ) : null}
                      {combinaTema ? <Badge variant="secondary">tema do projeto</Badge> : null}
                      <Badge variant={encerrada ? "outline" : "secondary"}>
                        {rotulo(SITUACOES_OPORTUNIDADE, o.situacao)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <dl className="grid gap-x-6 gap-y-2.5 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Modalidade
                      </dt>
                      <dd>{o.modalidadeNota}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Acesso municipal
                      </dt>
                      <dd>{o.acessoNota}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Prazo típico
                      </dt>
                      <dd>{o.prazo}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Temas
                      </dt>
                      <dd className="text-muted-foreground">{o.temasNota}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Faixa / referência
                      </dt>
                      <dd className="text-muted-foreground">{o.faixa}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Contrapartida
                      </dt>
                      <dd className="text-muted-foreground">{o.contrapartida}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-[12.5px]">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Rota de acesso ·{" "}
                      </span>
                      {o.rotaAcesso}
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      <span className="font-mono text-[10px] uppercase tracking-wider">
                        Exigências críticas ·{" "}
                      </span>
                      {o.exigencias}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                      Prioridade inicial: {o.prioridade}
                    </span>
                    <a
                      href={o.fonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground hover:text-primary"
                    >
                      fonte oficial <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-4">
        <CardContent>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            GCF, GEF e Fundo de Adaptação normalmente exigem entidade acreditada ou
            implementadora e anuência nacional — a prefeitura não envia isoladamente. Crédito
            externo municipal normalmente exige COFIEX, análise fiscal, autorização legislativa,
            STN e, quando aplicável, garantia da União e Senado. Assistência técnica de
            preparação não paga necessariamente a obra; seu objetivo é tornar o projeto
            financiável. Chamadas encerradas permanecem como canal de monitoramento e
            referência, não como oportunidade aberta.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
