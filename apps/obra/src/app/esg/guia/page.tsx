import Link from "next/link";
import { ObraShell } from "@/components/obra-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { getAlternativasMaterial, listRequisitosParaGuia } from "@/lib/queries";
import { EsgSubnav } from "../esg-subnav";

export const dynamic = "force-dynamic";

const categorias = [
  {
    id: "ambiental",
    titulo: "Ambiental",
    descricao:
      "É o eixo com catálogo pronto — os requisitos ativos abaixo (substituição de material, reciclagem, energia renovável...) já são auditáveis pela prefeitura.",
  },
  {
    id: "social",
    titulo: "Social",
    descricao:
      "Sem catálogo formal ainda: capacitação de mão de obra, contratação local, segurança do canteiro acima do exigido, acessibilidade. Descreva a ação e anexe a evidência (lista de presença, contrato, laudo).",
  },
  {
    id: "governanca",
    titulo: "Governança",
    descricao:
      "Também sem catálogo formal: política de compliance, transparência de fornecedores, canal de denúncia, due diligence de terceirizados. Mesma lógica — descrição + documento que comprove.",
  },
];

export default async function GuiaEsgPage() {
  const [requisitos, alternativas] = await Promise.all([listRequisitosParaGuia(), getAlternativasMaterial()]);
  const ativos = requisitos.filter((r) => r.natureza === "ativo");

  return (
    <ObraShell active="/esg">
      <EsgSubnav ativo="/esg/guia" />

      <div className="mb-8">
        <CardEyebrow>Guia ESG</CardEyebrow>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
          Como montar um projeto ESG
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-texto-fraco">
          Isto não é uma consultoria — é um mapa do que a prefeitura já audita, do que já está
          quantificado e de como o processo funciona, pra você decidir com dado em vez de achismo.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardTitle>1. O que conta como projeto ESG</CardTitle>
          <p className="mb-4 text-[13px] text-texto-fraco">
            Um projeto ESG cai numa de três categorias — ambiental, social ou governança —, mas só
            o eixo ambiental tem um catálogo de requisitos pré-auditados pela prefeitura hoje.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {categorias.map((c) => (
              <div key={c.id} className="rounded-sm border border-linha p-3">
                <p className="mb-1 font-display text-[13px] font-bold text-texto">{c.titulo}</p>
                <p className="text-[12px] leading-relaxed text-texto-fraco">{c.descricao}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>2. Ações que já compensam carbono (ativo)</CardTitle>
          <p className="mb-4 text-[13px] text-texto-fraco">
            Cada uma dessas é um requisito que a prefeitura já sabe auditar — quem entra num
            desses eixos já sabe de antemão qual documento vai precisar. Vários deles também
            reduzem custo real de obra (energia, água, resíduo) ou melhoram a qualidade
            (desempenho energético), não só o balanço de carbono.
          </p>
          <div className="grid gap-3">
            {ativos.map((r) => (
              <div key={r.id} className="rounded-sm border border-linha p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="ativo">{r.codigo}</Badge>
                    <span className="font-display text-[13px] font-semibold text-texto">
                      {r.requisito}
                    </span>
                    <span className="font-mono text-[10.5px] text-texto-fraco">({r.unidade})</span>
                  </div>
                  <Link
                    href={`/esg/novo?requisito=${r.id}&titulo=${encodeURIComponent(r.requisito)}`}
                    className="shrink-0 font-mono text-[10.5px] uppercase tracking-wide text-verde hover:underline"
                  >
                    criar projeto com este requisito →
                  </Link>
                </div>
                <p className="text-[12px] leading-relaxed text-texto-fraco">
                  <span className="text-texto">Evidência necessária:</span> {r.evidenciaPrimaria}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-texto-fraco">
                  <span className="text-texto">Como é verificado:</span> {r.testeVerificacao}
                </p>
              </div>
            ))}
            {ativos.length === 0 ? (
              <p className="text-[13px] text-texto-fraco">
                Nenhum requisito ativo cadastrado pela prefeitura ainda.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardTitle>3. Quantifique antes de decidir</CardTitle>
          <p className="mb-4 text-[13px] text-texto-fraco">
            Pra substituição de material (SUB) especificamente, o Simulador de decisão já calcula
            R$ investido por tCO₂e evitado, material a material — é o mesmo dado que vira evidência
            do projeto.
          </p>
          {alternativas.length > 0 ? (
            <div className="mb-4 grid gap-2">
              {alternativas.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-sm bg-concreto px-3 py-2 text-[12px]"
                >
                  <span className="text-texto">
                    {a.material} <span className="text-texto-fraco">em vez de {a.original}</span>
                  </span>
                  <span className="font-mono text-texto-fraco">
                    +R$ {a.custoAdicionalPorUnidade.toLocaleString("pt-BR")}/{a.unidade} ·{" "}
                    {a.tco2eEvitadoPorUnidade.toLocaleString("pt-BR")} tCO₂e/{a.unidade}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <a
            href="/simulador"
            className="inline-flex items-center rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
          >
            Abrir o simulador
          </a>
        </Card>

        <Card>
          <CardTitle>4. Monte e envie</CardTitle>
          <p className="mb-4 text-[13px] text-texto-fraco">
            Escolha uma ação (ou uma iniciativa social/governança), escreva o que foi feito, anexe
            a evidência e, se fizer sentido, relacione ao requisito auditável correspondente — ajuda
            o analista da prefeitura a entender o contexto mais rápido. Depois de enviado, o projeto
            segue: <span className="text-texto">enviado → em análise → aprovado ou rejeitado</span>.
          </p>
          <Link
            href="/esg/novo"
            className="inline-flex items-center rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
          >
            Criar novo projeto ESG
          </Link>
        </Card>

        <Card>
          <CardTitle>5. Como isso vira desconto fiscal</CardTitle>
          <p className="text-[13px] leading-relaxed text-texto-fraco">
            Dois mecanismos correm em paralelo e a prefeitura decide os dois: a{" "}
            <span className="text-texto">intensidade do inventário</span> (kgCO₂e/m²) define a
            faixa do selo — quanto menor, melhor a faixa —, e os{" "}
            <span className="text-texto">projetos ESG aprovados</span> documentam o esforço por
            trás disso. O benefício concreto (percentual de desconto, faixa exigida) é definido pela
            régua de cada município e só vale depois de homologado — este guia não promete um
            número, porque ele não depende só de você.
          </p>
        </Card>
      </div>
    </ObraShell>
  );
}
