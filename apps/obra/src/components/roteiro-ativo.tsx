import { Card, CardTitle } from "@carbonfree/ui/card";
import { Badge } from "@carbonfree/ui/badge";
import type { BaseLegal, CamadaEstadual, RoteiroAtivo } from "@/lib/roteiros-ativo";

/**
 * Passo a passo de aceitação de um ativo, dentro do projeto ESG.
 *
 * A ordem é o conteúdo: cada passo diz em que momento da obra precisa
 * acontecer e o que reprova. Descobrir na análise que o MTR foi emitido depois
 * da remoção custa a obra inteira.
 */
export function RoteiroDoAtivo({
  roteiro,
  baseLegal,
  camadaEstadual,
  uf,
}: {
  roteiro: RoteiroAtivo;
  /** Vem de `requisitos_auditoria.base_legal` — a citação é do banco, o roteiro é do código. */
  baseLegal: BaseLegal[];
  /** Procedimento do estado da obra. `null` quando não há camada escrita para a UF. */
  camadaEstadual: CamadaEstadual | null;
  /** UF da obra, para dizer de qual estado se está falando quando não há camada. */
  uf: string | null;
}) {
  const imediatos = roteiro.beneficios.filter((b) => b.natureza === "imediato");
  const municipais = roteiro.beneficios.filter((b) => b.natureza === "municipal");

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>Como este ativo é aceito</CardTitle>
        <p className="mb-5 text-[13px] leading-relaxed text-texto-fraco">{roteiro.resumo}</p>

        <ol className="grid gap-0 border-t border-linha">
          {roteiro.passos.map((p, i) => (
            <li key={p.titulo} className="grid grid-cols-[28px_1fr] gap-3 border-b border-linha py-4">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-sm bg-verde font-mono text-[11px] font-semibold text-papel">
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-texto-fraco">
                  {p.quando}
                </span>
                <h3 className="mt-1 font-display text-[14.5px] font-bold text-texto">{p.titulo}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-texto-fraco">{p.oQueFazer}</p>

                <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-texto">
                  <span className="text-verde">documento · </span>
                  {p.documento}
                </p>

                {p.reprovaSe ? (
                  <p className="mt-1.5 border-l-2 border-ambar pl-2.5 font-mono text-[11px] leading-relaxed text-texto-fraco">
                    <span className="text-ambar">reprova se · </span>
                    {p.reprovaSe}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-[12.5px] leading-relaxed text-texto-fraco">
          <span className="font-semibold text-texto">Como entra na conta.</span>{" "}
          {roteiro.comoEntraNoCalculo}
        </p>
      </Card>

      <Card>
        <CardTitle>O que este ativo traz de volta</CardTitle>

        <div className="mb-2 mt-3 flex items-center gap-2">
          <Badge tone="ativo">vale desde já</Badge>
          <span className="font-mono text-[10px] uppercase tracking-wide text-texto-fraco">
            independe de programa municipal
          </span>
        </div>
        <ul className="grid gap-3">
          {imediatos.map((b) => (
            <li key={b.titulo}>
              <span className="font-display text-[13.5px] font-bold text-texto">{b.titulo}</span>
              <p className="mt-0.5 text-[13px] leading-relaxed text-texto-fraco">{b.detalhe}</p>
            </li>
          ))}
        </ul>

        {municipais.length > 0 ? (
          <>
            <div className="mb-2 mt-5 flex items-center gap-2">
              <Badge tone="neutro">depende do município</Badge>
              <span className="font-mono text-[10px] uppercase tracking-wide text-texto-fraco">
                só onde a régua foi instituída por lei
              </span>
            </div>
            <ul className="grid gap-3">
              {municipais.map((b) => (
                <li key={b.titulo}>
                  <span className="font-display text-[13.5px] font-bold text-texto">{b.titulo}</span>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-texto-fraco">{b.detalhe}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>

      <Card>
        <CardTitle>
          No seu estado{camadaEstadual ? ` — ${camadaEstadual.uf}` : ""}
        </CardTitle>
        {camadaEstadual ? (
          <>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
                  Órgão ambiental
                </p>
                <p className="mt-0.5 text-[13px] text-texto">{camadaEstadual.orgao}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
                  Onde emitir o MTR
                </p>
                <p className="mt-0.5 text-[13px] text-texto">{camadaEstadual.sistemaMtr}</p>
              </div>
            </div>

            <p className="mb-3 text-[12.5px] leading-relaxed text-texto-fraco">
              {camadaEstadual.norma}
            </p>

            <p className="mb-1 font-display text-[13px] font-bold text-texto">
              Quem licencia o receptor
            </p>
            <p className="mb-4 text-[12.5px] leading-relaxed text-texto-fraco">
              {camadaEstadual.competenciaLicenciamento}
            </p>

            <p className="mb-1 font-display text-[13px] font-bold text-texto">
              O que invalida o documento aqui
            </p>
            <ul className="grid gap-2">
              {camadaEstadual.atencao.map((a) => (
                <li
                  key={a}
                  className="rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12.5px] leading-relaxed text-ambar"
                >
                  {a}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-texto-fraco">
            O procedimento estadual{uf ? ` de ${uf}` : ""} ainda não foi levantado para este
            requisito. Os passos acima valem em qualquer estado — mas o órgão que licencia o
            receptor e o sistema em que o MTR é emitido mudam por unidade da federação, e é no
            órgão do seu estado que essa parte precisa ser confirmada.
          </p>
        )}
      </Card>

      {baseLegal.length > 0 ? (
      <Card>
        <CardTitle>Base legal</CardTitle>
        <ul className="mt-2 grid gap-3">
          {baseLegal.map((l) => (
            <li key={l.norma}>
              <span className="font-display text-[13px] font-bold text-texto">{l.norma}</span>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-texto-fraco">{l.oQueExige}</p>
            </li>
          ))}
        </ul>
      </Card>
      ) : null}
    </div>
  );
}
