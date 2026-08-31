import { Badge } from "@carbonfree/ui/badge";
import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { faixaDe, getDossie, type FaixaRegua } from "@/lib/queries";
import { Composicao, EvolucaoIntensidade, PassivoAtivoPorVersao } from "./graficos";

const RANK: Record<string, number> = {
  rascunho: 0,
  protocolado: 1,
  em_analise: 2,
  homologado: 3,
  rejeitado: 3,
};

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("pt-BR");

function Kpi({
  label,
  valor,
  unidade,
  tom = "neutro",
}: {
  label: string;
  valor: string;
  unidade?: string;
  tom?: "neutro" | "passivo" | "ativo";
}) {
  const cor = tom === "passivo" ? "text-ambar" : tom === "ativo" ? "text-verde" : "text-texto";
  return (
    <Card className="py-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">{label}</p>
      <p className={`mt-1.5 font-mono text-[26px] leading-none font-semibold tabular-nums ${cor}`}>
        {valor}
        {unidade ? (
          <span className="ml-1 text-[11px] font-normal text-texto-fraco">{unidade}</span>
        ) : null}
      </p>
    </Card>
  );
}

/** Passos do trâmite como trilha horizontal. */
function Tramite({ etapas }: { etapas: { nome: string; concluida: boolean }[] }) {
  const feitas = etapas.filter((e) => e.concluida).length;

  return (
    <Card>
      <div className="mb-5 flex items-baseline justify-between">
        <CardTitle className="mb-0">Trâmite do dossiê</CardTitle>
        <span className="font-mono text-[11px] text-texto-fraco">
          {feitas} de {etapas.length} concluídas
        </span>
      </div>

      <ol className="grid gap-5 md:grid-cols-4">
        {etapas.map((etapa, i) => {
          const proxima = !etapa.concluida && etapas.slice(0, i).every((e) => e.concluida);
          return (
            <li key={etapa.nome} className="relative">
              {/* trilho ligando ao próximo passo (só em telas largas) */}
              {i < etapas.length - 1 ? (
                <span
                  aria-hidden
                  className={`absolute top-3 left-8 hidden h-px w-[calc(100%-1rem)] md:block ${
                    etapa.concluida ? "bg-verde" : "bg-linha"
                  }`}
                />
              ) : null}

              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${
                    etapa.concluida
                      ? "border-verde bg-verde text-papel"
                      : proxima
                        ? "border-ambar text-ambar"
                        : "border-linha text-texto-fraco"
                  }`}
                >
                  {etapa.concluida ? "✓" : i + 1}
                </span>
                {proxima ? (
                  <Badge tone="passivo" className="text-[9px]">
                    em curso
                  </Badge>
                ) : null}
              </div>

              <p
                className={`mt-2 text-[13px] leading-snug ${
                  etapa.concluida ? "text-texto" : "text-texto-fraco"
                }`}
              >
                {etapa.nome}
              </p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** Régua de faixas do município com a posição da obra. */
function ReguaSelo({ intensidade, regua }: { intensidade: number; regua: FaixaRegua[] }) {
  // Régua vazia não é "faixa mais alta" — é ausência de régua. Sem esta saída
  // antecipada, `findIndex` devolve -1, `melhor` vira null e a tela cai no ramo
  // que parabeniza a obra por estar no topo de uma escala que não existe.
  if (regua.length === 0) {
    return (
      <Card>
        <CardTitle>Régua do selo municipal</CardTitle>
        <p className="rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12.5px] text-ambar">
          Este município ainda não tem régua calibrada no sistema. A intensidade da obra continua
          sendo calculada e vale para o inventário — o que não existe ainda é a faixa que converte
          essa intensidade em benefício fiscal.
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-texto-fraco">
          A régua é calibrada por município, sobre a distribuição real das obras locais: uma escala
          importada de outra cidade distribuiria benefício sem induzir mudança, ou esvaziaria o
          programa. Enquanto a prefeitura não publica a sua, o dossiê não estima faixa.
        </p>
      </Card>
    );
  }

  const atual = faixaDe(intensidade, regua);
  const indice = regua.findIndex((f) => f.faixa === atual?.faixa);
  const melhor = indice > 0 ? regua[indice - 1] : null;
  const falta = melhor ? intensidade - melhor.ate_kgco2e_m2 : 0;

  return (
    <Card>
      <CardTitle>Régua do selo municipal</CardTitle>
      <p className="mb-4 text-[12.5px] text-texto-fraco">
        A faixa alcançada define o benefício fiscal concedido pela prefeitura.
      </p>

      <ul className="space-y-1.5">
        {regua.map((f) => {
          const eAtual = f.faixa === atual?.faixa;
          return (
            <li
              key={f.faixa}
              className={`flex items-center gap-3 rounded-sm border px-3 py-2 ${
                eAtual ? "border-verde bg-verde-claro" : "border-transparent"
              }`}
            >
              <Badge tone={eAtual ? "ativo" : "default"} className="w-10 justify-center">
                {f.faixa}
              </Badge>
              <span className="w-28 shrink-0 font-mono text-[11px] text-texto-fraco">
                {f.ate_kgco2e_m2 > 10000 ? "sem limite" : `≤ ${fmt(f.ate_kgco2e_m2)} kg/m²`}
              </span>
              <span
                className={`min-w-0 flex-1 text-[12.5px] ${eAtual ? "text-texto" : "text-texto-fraco"}`}
              >
                {f.beneficio}
              </span>
              {eAtual ? (
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-verde">
                  atual
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {melhor ? (
        <p className="mt-4 border-t border-linha/60 pt-3 text-[12.5px] text-texto-fraco">
          Faltam <span className="font-mono text-texto">{fmt(falta)} kgCO₂e/m²</span> para alcançar a
          faixa <span className="font-mono text-texto">{melhor.faixa}</span> — {melhor.beneficio}.
        </p>
      ) : (
        <p className="mt-4 border-t border-linha/60 pt-3 text-[12.5px] text-verde">
          A obra já está na faixa mais alta da régua municipal.
        </p>
      )}
    </Card>
  );
}

export default async function DossiePage() {
  const { obra, versoes, atual, composicaoPassivo, composicaoAtivo, regua, tetoCompensacaoPct } =
    await getDossie();

  const temInventario = versoes.length > 0 && atual !== null;
  const rank = RANK[atual?.status ?? "rascunho"] ?? 0;
  const reguaCalibrada = regua.length > 0;
  const faixa = atual ? faixaDe(atual.intensidade, regua) : null;

  const etapas = [
    { nome: "Inventário ISO 14064-1 gerado", concluida: temInventario },
    { nome: "Assinatura do responsável técnico (gov.br)", concluida: temInventario && rank >= 1 },
    { nome: "Protocolo na prefeitura", concluida: temInventario && rank >= 2 },
    {
      nome: "Homologação e emissão do selo",
      concluida: temInventario && atual?.status === "homologado",
    },
  ];

  const saldo = atual ? atual.passivo - atual.ativo : 0;
  const compensacaoPct = atual && atual.passivo > 0 ? (atual.ativo / atual.passivo) * 100 : 0;
  const acimaDoTeto = compensacaoPct > tetoCompensacaoPct;

  return (
    <ObraShell active="/dossie">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardEyebrow>
            {obra.alvara} · {faseLabel[obra.fase] ?? obra.fase} · {fmt(obra.areaM2)} m²
          </CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            Dossiê e assinatura
          </h1>
          <p className="mt-1 text-[13.5px] text-texto-fraco">{obra.nome}</p>
        </div>

        {faixa ? (
          <div className="rounded-md border border-verde bg-verde-claro px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
              Faixa alcançada
            </p>
            <p className="mt-0.5 font-display text-2xl font-extrabold text-verde">{faixa.faixa}</p>
            <p className="mt-0.5 text-[12px] text-texto">{faixa.beneficio}</p>
          </div>
        ) : null}
      </div>

      {!temInventario ? (
        <Card>
          <p className="py-12 text-center text-[13.5px] text-texto-fraco">
            Nenhum inventário lançado ainda. O dossiê é montado a partir da primeira versão do
            inventário da obra.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Intensidade" valor={fmt(atual.intensidade)} unidade="kgCO₂e/m²" tom="ativo" />
            <Kpi label="Saldo líquido" valor={fmt(saldo)} unidade="tCO₂e" />
            <Kpi label="Passivo" valor={fmt(atual.passivo)} unidade="tCO₂e" tom="passivo" />
            <Kpi label="Ativo" valor={fmt(atual.ativo)} unidade="tCO₂e" tom="ativo" />
          </div>

          <Tramite etapas={etapas} />

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <div className="mb-1 flex items-baseline justify-between">
                <CardTitle className="mb-0">Intensidade por versão</CardTitle>
                {reguaCalibrada ? (
                  <span className="font-mono text-[10.5px] text-texto-fraco">
                    tracejado = faixas do selo
                  </span>
                ) : null}
              </div>
              <p className="mb-3 text-[12.5px] text-texto-fraco">
                {reguaCalibrada
                  ? "Quanto mais baixa a curva, melhor a faixa e maior o benefício fiscal."
                  : "Quanto mais baixa a curva, melhor o desempenho da obra. Sem régua municipal calibrada, não há faixa de referência a traçar."}
              </p>
              <EvolucaoIntensidade versoes={versoes} regua={regua} />
            </Card>

            <Card className="lg:col-span-2">
              <CardTitle>Passivo × ativo por versão</CardTitle>
              <p className="mb-3 text-[12.5px] text-texto-fraco">
                Compensação atual:{" "}
                <span className={acimaDoTeto ? "font-mono text-ambar" : "font-mono text-texto"}>
                  {Math.round(compensacaoPct)}%
                </span>{" "}
                do passivo (teto municipal {fmt(tetoCompensacaoPct)}%).
              </p>
              {acimaDoTeto ? (
                <p className="mb-3 rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12px] text-ambar">
                  Acima do teto de compensação do município — o excedente pode não ser aceito no
                  cálculo do selo.
                </p>
              ) : null}
              <PassivoAtivoPorVersao versoes={versoes} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>Composição do passivo · v{atual.versao}</CardTitle>
              <p className="mb-3 text-[12.5px] text-texto-fraco">
                O que a obra emite, por módulo EN 15978.
              </p>
              <Composicao itens={composicaoPassivo} cor="passivo" />
            </Card>

            <Card>
              <CardTitle>Composição do ativo · v{atual.versao}</CardTitle>
              <p className="mb-3 text-[12.5px] text-texto-fraco">
                O que reduz ou remove, por tipo de ação.
              </p>
              <Composicao itens={composicaoAtivo} cor="ativo" />
            </Card>
          </div>

          <ReguaSelo intensidade={atual.intensidade} regua={regua} />
        </div>
      )}
    </ObraShell>
  );
}
