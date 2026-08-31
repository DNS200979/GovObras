"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardTitle } from "@carbonfree/ui/card";
import { cn } from "@carbonfree/ui/cn";
import {
  CONDICIONANTES_GERAIS,
  DIMENSOES,
  DOCUMENTACAO_MINIMA,
  RESSALVAS_ALTURA,
  simularCertificacao,
  statusBeneficioFiscalLabel,
  statusCertificacaoLabel,
  validadeCertificado,
  type CodigoDimensao,
  type PontosPorDimensao,
  type StatusBeneficioFiscal,
  type StatusCertificacao,
} from "@/lib/certificacao-poa";
import type { CertificacaoObra } from "@/lib/queries";
import { atualizarTramite, salvarQuadro, type ItemQuadro } from "./actions";

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Catálogo é a fonte da dimensão de cada critério — o banco só guarda o código. */
const DIMENSAO_DO_CRITERIO = new Map<string, CodigoDimensao>(
  DIMENSOES.flatMap((d) => d.criterios.map((c) => [c.codigo, d.codigo] as const)),
);

export interface ObraOpcao {
  id: string;
  nome: string;
  municipio: string;
}

export interface AlertaPrazo {
  exercicioSePedirHoje: number;
  prazo: string | null;
  mensagem: string;
}

interface EstadoCriterio {
  pontos: number;
  faixa: string | null;
}

export function SimuladorCertificacao({
  obras,
  obraId,
  certificacao,
  alerta,
}: {
  obras: ObraOpcao[];
  obraId: string;
  certificacao: CertificacaoObra | null;
  alerta: AlertaPrazo;
}) {
  const router = useRouter();
  const [salvando, iniciarSalvamento] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [criterios, setCriterios] = useState<Record<string, EstadoCriterio>>(() =>
    Object.fromEntries(
      (certificacao?.itens ?? []).map((i) => [i.criterioCodigo, { pontos: i.pontos, faixa: i.faixa }]),
    ),
  );
  const [iptuAnual, setIptuAnual] = useState<number | "">(certificacao?.iptuAnualReferencia ?? "");
  const [alturaBasica, setAlturaBasica] = useState<number | "">(certificacao?.alturaBasicaM ?? "");

  const obra = obras.find((o) => o.id === obraId) ?? null;
  const foraDePortoAlegre = obra !== null && !obra.municipio.startsWith("Porto Alegre");

  const pontosPorDimensao = useMemo<PontosPorDimensao>(() => {
    const acc: PontosPorDimensao = {};
    for (const d of DIMENSOES) {
      acc[d.codigo] = d.criterios.reduce(
        (soma, c) => soma + (criterios[c.codigo]?.pontos ?? 0),
        0,
      );
    }
    return acc;
  }, [criterios]);

  const resultado = useMemo(
    () =>
      simularCertificacao(pontosPorDimensao, {
        iptuAnual: iptuAnual === "" ? undefined : iptuAnual,
        alturaBasicaM: alturaBasica === "" ? undefined : alturaBasica,
      }),
    [pontosPorDimensao, iptuAnual, alturaBasica],
  );

  /** Só os documentos dos critérios efetivamente pontuados — é o que a SMAMUS vai cobrar. */
  const documentosNecessarios = useMemo(() => {
    const docs = new Set<string>();
    for (const d of DIMENSOES) {
      for (const c of d.criterios) {
        if ((criterios[c.codigo]?.pontos ?? 0) > 0) c.documentos.forEach((doc) => docs.add(doc));
      }
    }
    return [...docs].sort();
  }, [criterios]);

  const definir = (codigo: string, pontos: number, faixa: string | null = null) =>
    setCriterios((atual) => ({ ...atual, [codigo]: { pontos, faixa } }));

  const porDimensao = (codigo: CodigoDimensao) =>
    resultado.dimensoes.find((d) => d.codigo === codigo)!;

  function onSalvarQuadro() {
    setAviso(null);
    const itens: ItemQuadro[] = Object.entries(criterios)
      .filter(([, v]) => v.pontos > 0)
      .map(([codigo, v]) => ({
        criterioCodigo: codigo,
        dimensao: DIMENSAO_DO_CRITERIO.get(codigo)!,
        pontos: v.pontos,
        faixa: v.faixa,
      }));

    iniciarSalvamento(async () => {
      const r = await salvarQuadro({
        obraId,
        iptuAnual: iptuAnual === "" ? null : iptuAnual,
        alturaBasicaM: alturaBasica === "" ? null : alturaBasica,
        nivelPretendido: resultado.nivel?.nivel ?? null,
        itens,
      });
      setAviso(
        r.error ? { tipo: "erro", texto: r.error } : { tipo: "ok", texto: "Quadro salvo." },
      );
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card>
          <CardTitle>Empreendimento</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
                Obra
              </span>
              <select
                value={obraId}
                onChange={(e) => router.push(`/esg/certificacao?obra=${e.target.value}`)}
                className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[13px] text-texto"
              >
                {obras.length === 0 ? <option value="">Nenhuma obra cadastrada</option> : null}
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome} · {o.municipio}
                  </option>
                ))}
              </select>
            </label>
            <CampoNumero
              rotulo="IPTU anual (R$)"
              valor={iptuAnual}
              onChange={setIptuAnual}
              placeholder="300000"
            />
            <CampoNumero
              rotulo="Altura máxima do regime (m)"
              valor={alturaBasica}
              onChange={setAlturaBasica}
              placeholder="60"
            />
          </div>

          {foraDePortoAlegre ? (
            <p className="mt-3 rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12.5px] text-ambar">
              Esta obra está em {obra?.municipio}. O quadro abaixo é o programa de Porto Alegre
              (Decreto nº 21.789/2022) — outro município tem programa próprio, com dimensões e
              pontuações diferentes. Serve como simulação, não como pedido.
            </p>
          ) : null}
        </Card>

        {DIMENSOES.map((d) => {
          const av = porDimensao(d.codigo);
          return (
            <Card key={d.codigo}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-linha/60 pb-2">
                <div className="flex items-center gap-2">
                  <Badge tone={av.aprovada ? "ativo" : "default"}>{d.codigo}</Badge>
                  <h3 className="font-display text-[14px] font-bold tracking-tight text-texto">
                    {d.nome}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-[12px] font-semibold",
                      av.aprovada ? "text-verde" : "text-texto-fraco",
                    )}
                  >
                    {av.pontos} / {d.minimo} pts
                  </span>
                  <Badge tone={av.aprovada ? "ativo" : "passivo"}>
                    {av.aprovada ? "aprovada" : `faltam ${av.faltam}`}
                  </Badge>
                </div>
              </div>

              <ul className="space-y-3">
                {d.criterios.map((c) => {
                  const atual = criterios[c.codigo]?.pontos ?? 0;
                  return (
                    <li key={c.codigo} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-texto">
                          <span className="font-mono text-[10.5px] text-texto-fraco">
                            {c.codigo}
                          </span>{" "}
                          {c.criterio}
                        </p>
                        {c.observacao ? (
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-texto-fraco">
                            {c.observacao}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        {c.pontos !== null ? (
                          <label className="flex cursor-pointer items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={atual > 0}
                              onChange={(e) => definir(c.codigo, e.target.checked ? c.pontos! : 0)}
                              className="accent-verde"
                            />
                            <span className="font-mono text-[11px] text-texto-fraco">
                              {c.pontos} pts
                            </span>
                          </label>
                        ) : c.faixas ? (
                          <select
                            value={criterios[c.codigo]?.faixa ?? ""}
                            onChange={(e) => {
                              const f = c.faixas!.find((x) => x.condicao === e.target.value);
                              definir(c.codigo, f?.pontos ?? 0, f?.condicao ?? null);
                            }}
                            className="rounded-sm border border-linha bg-papel px-2 py-1 text-[12px] text-texto"
                          >
                            <option value="">não atende</option>
                            {c.faixas.map((f) => (
                              <option key={f.condicao} value={f.condicao}>
                                {f.condicao} — {f.pontos} pts
                              </option>
                            ))}
                          </select>
                        ) : (
                          <label className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={atual === 0 ? "" : atual}
                              onChange={(e) => definir(c.codigo, Number(e.target.value) || 0)}
                              placeholder="0"
                              className="w-16 rounded-sm border border-linha bg-papel px-2 py-1 text-right text-[12px] text-texto"
                            />
                            <span className="font-mono text-[10px] leading-tight text-texto-fraco">
                              pts
                              <br />
                              Anexo I
                            </span>
                          </label>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSalvarQuadro}
            disabled={salvando || !obraId}
            className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar quadro"}
          </button>
          {certificacao ? (
            <span className="font-mono text-[11px] text-texto-fraco">
              salvo em {new Date(certificacao.atualizadoEm).toLocaleString("pt-BR")}
            </span>
          ) : null}
          {aviso ? (
            <span
              className={cn(
                "text-[12.5px]",
                aviso.tipo === "ok" ? "text-verde" : "text-ambar",
              )}
            >
              {aviso.texto}
            </span>
          ) : null}
        </div>
      </div>

      {/* ---------------- painel de resultado ---------------- */}
      <div className="space-y-4">
        <Card>
          <CardTitle>Resultado</CardTitle>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold tracking-tight text-texto">
              {resultado.nivel ? resultado.nivel.rotulo : "Sem selo"}
            </span>
            <span className="font-mono text-[11px] text-texto-fraco">
              {resultado.aprovadas}/7 dimensões
            </span>
          </div>

          {resultado.nivel ? (
            <ul className="space-y-1.5 text-[12.5px] text-texto">
              <li>
                IPTU: <strong>até {resultado.nivel.beneficios.iptuTetoPct}%</strong> de redução
              </li>
              <li>
                Altura:{" "}
                <strong>
                  {resultado.nivel.beneficios.acrescimoAlturaPct > 0
                    ? `+${resultado.nivel.beneficios.acrescimoAlturaPct}%`
                    : "sem acréscimo"}
                </strong>
              </li>
              <li>
                Licenciamento:{" "}
                <strong>
                  {resultado.nivel.beneficios.licenciamentoPrioritario
                    ? "análise prioritária"
                    : "sem prioridade"}
                </strong>
              </li>
              <li className="pt-1 font-mono text-[10.5px] text-texto-fraco">
                {resultado.nivel.baseLegal}
              </li>
            </ul>
          ) : (
            <p className="text-[12.5px] text-texto-fraco">
              O selo mais baixo (Bronze) exige o mínimo em 2 das 7 dimensões.
            </p>
          )}

          {resultado.proximo ? (
            <p className="mt-3 rounded-sm border border-linha bg-concreto px-3 py-2 text-[12px] text-texto">
              Falta{resultado.proximo.faltamDimensoes > 1 ? "m" : ""}{" "}
              <strong>{resultado.proximo.faltamDimensoes}</strong>{" "}
              {resultado.proximo.faltamDimensoes > 1 ? "dimensões" : "dimensão"} para{" "}
              <strong>{resultado.proximo.nivel.rotulo}</strong>.
            </p>
          ) : (
            <p className="mt-3 rounded-sm border border-verde/40 bg-verde-claro px-3 py-2 text-[12px] text-verde">
              Diamante sai com 5 dimensões — não é preciso aprovar as sete.
            </p>
          )}
        </Card>

        {resultado.maisProximasDeAprovar.length > 0 ? (
          <Card>
            <CardTitle>Onde falta menos</CardTitle>
            <ul className="space-y-1.5">
              {resultado.maisProximasDeAprovar.slice(0, 4).map((d) => (
                <li key={d.codigo} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="truncate text-texto">{d.nome}</span>
                  <span className="shrink-0 font-mono text-[11px] text-texto-fraco">
                    +{d.faltam} pts
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card>
          <CardTitle>Estimativa financeira</CardTitle>
          {resultado.economiaIptuAnualMaxima !== null ? (
            <ul className="space-y-1.5 text-[12.5px] text-texto">
              <li>
                Economia máxima anual:{" "}
                <strong>{fmtBRL(resultado.economiaIptuAnualMaxima)}</strong>
              </li>
              <li>
                No ciclo de 3 anos: <strong>{fmtBRL(resultado.economiaCicloMaxima!)}</strong>
              </li>
            </ul>
          ) : (
            <p className="text-[12.5px] text-texto-fraco">
              Informe o IPTU anual e alcance ao menos Bronze para estimar.
            </p>
          )}
          <p className="mt-2 text-[11.5px] leading-relaxed text-texto-fraco">
            Teto legal. O percentual efetivo é definido pelo município e sujeito às condições
            legais — trate como limite superior, não como valor a receber.
          </p>

          {resultado.alturaPotencialM !== null ? (
            <p className="mt-3 border-t border-linha/60 pt-3 text-[12.5px] text-texto">
              Altura potencial: <strong>{resultado.alturaPotencialM.toFixed(1)} m</strong>
            </p>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Prazo do IPTU</CardTitle>
          <p className="text-[12.5px] leading-relaxed text-texto">{alerta.mensagem}</p>
          {alerta.prazo ? (
            <p className="mt-2 rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 font-mono text-[11.5px] text-ambar">
              prazo: {alerta.prazo}
            </p>
          ) : null}
        </Card>

        <PainelTramite obraId={obraId} certificacao={certificacao} />

        <Card>
          <CardTitle>Documentos deste quadro</CardTitle>
          {documentosNecessarios.length === 0 ? (
            <p className="text-[12.5px] text-texto-fraco">
              Marque os critérios e a lista de comprovação aparece aqui.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-4 text-[12px] text-texto">
              {documentosNecessarios.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-linha/60 pt-3 font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
            sempre exigido
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-texto-fraco">
            {DOCUMENTACAO_MINIMA.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Antes de contar com o ganho de altura</CardTitle>
          <ul className="list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-texto-fraco">
            {RESSALVAS_ALTURA.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Condicionantes gerais</CardTitle>
          <ul className="space-y-2">
            {CONDICIONANTES_GERAIS.map((c) => (
              <li key={c.titulo}>
                <p className="font-display text-[12.5px] font-bold text-texto">{c.titulo}</p>
                <p className="text-[11.5px] leading-relaxed text-texto-fraco">{c.detalhe}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/**
 * Os dois trâmites, lado a lado.
 *
 * A SMAMUS emite o certificado; o desconto é pedido depois, em processo
 * separado, à SMF. Certificado aprovado com benefício "não solicitado" é
 * exatamente o estado que faz a construtora perder o desconto sem perceber —
 * por isso os dois status ficam visíveis juntos, e não em telas diferentes.
 */
function PainelTramite({
  obraId,
  certificacao,
}: {
  obraId: string;
  certificacao: CertificacaoObra | null;
}) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  const [statusCert, setStatusCert] = useState<StatusCertificacao>(
    certificacao?.statusCertificacao ?? "nao_iniciada",
  );
  const [statusFiscal, setStatusFiscal] = useState<StatusBeneficioFiscal>(
    certificacao?.statusBeneficioFiscal ?? "nao_solicitado",
  );
  const [protocolo, setProtocolo] = useState(certificacao?.protocolo ?? "");
  const [protocoladaEm, setProtocoladaEm] = useState(certificacao?.protocoladaEm ?? "");
  const [emitidoEm, setEmitidoEm] = useState(certificacao?.emitidoEm ?? "");
  const [validade, setValidade] = useState(certificacao?.validade ?? "");
  const [cartaHabitacao, setCartaHabitacao] = useState(
    certificacao?.cartaHabitacaoEmitida ?? false,
  );
  const [observacoes, setObservacoes] = useState(certificacao?.observacoes ?? "");

  /** Validade acompanha a emissão: 3 anos. Preenche sozinha, mas continua editável. */
  function aoMudarEmissao(valor: string) {
    setEmitidoEm(valor);
    if (valor) {
      setValidade(validadeCertificado(new Date(`${valor}T12:00:00`)).toISOString().slice(0, 10));
    }
  }

  const certificadoSemPedidoFiscal =
    statusCert === "aprovada" && statusFiscal === "nao_solicitado";
  const descontoSemCartaHabitacao = statusFiscal !== "nao_solicitado" && !cartaHabitacao;

  function salvar() {
    setAviso(null);
    iniciar(async () => {
      const r = await atualizarTramite({
        obraId,
        statusCertificacao: statusCert,
        statusBeneficioFiscal: statusFiscal,
        protocolo: protocolo.trim() || null,
        protocoladaEm: protocoladaEm || null,
        emitidoEm: emitidoEm || null,
        validade: validade || null,
        nivelObtido: certificacao?.nivelObtido ?? null,
        cartaHabitacaoEmitida: cartaHabitacao,
        observacoes: observacoes.trim() || null,
      });
      setAviso(r.error ?? "Trâmite salvo.");
      if (r.ok) router.refresh();
    });
  }

  return (
    <Card>
      <CardTitle>Dois trâmites, dois status</CardTitle>
      <p className="mb-3 text-[12px] leading-relaxed text-texto-fraco">
        A SMAMUS emite o certificado. O desconto é pedido <em>depois</em>, em processo separado,
        à Secretaria Municipal da Fazenda.
      </p>

      <div className="space-y-3">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
            Certificação ambiental (SMAMUS)
          </span>
          <select
            value={statusCert}
            onChange={(e) => setStatusCert(e.target.value as StatusCertificacao)}
            className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[12.5px] text-texto"
          >
            {Object.entries(statusCertificacaoLabel).map(([v, rotulo]) => (
              <option key={v} value={v}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
            Benefício fiscal (SMF)
          </span>
          <select
            value={statusFiscal}
            onChange={(e) => setStatusFiscal(e.target.value as StatusBeneficioFiscal)}
            className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[12.5px] text-texto"
          >
            {Object.entries(statusBeneficioFiscalLabel).map(([v, rotulo]) => (
              <option key={v} value={v}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        {certificadoSemPedidoFiscal ? (
          <p className="rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12px] text-ambar">
            Certificado aprovado e nenhum pedido à SMF. O desconto de IPTU não vem sozinho —
            depende de pedido separado à Fazenda.
          </p>
        ) : null}

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
            Protocolo
          </span>
          <input
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            placeholder="nº no Portal de Licenciamento"
            className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[12.5px] text-texto"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <CampoData rotulo="Protocolada em" valor={protocoladaEm} onChange={setProtocoladaEm} />
          <CampoData rotulo="Certificado em" valor={emitidoEm} onChange={aoMudarEmissao} />
        </div>

        <CampoData rotulo="Validade (3 anos)" valor={validade} onChange={setValidade} />

        {certificacao?.exercicioBeneficio ? (
          <p className="rounded-sm border border-linha bg-concreto px-3 py-2 text-[12px] text-texto">
            Pela data de protocolo, o desconto começa no IPTU{" "}
            <strong>{certificacao.exercicioBeneficio}</strong>.
          </p>
        ) : null}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={cartaHabitacao}
            onChange={(e) => setCartaHabitacao(e.target.checked)}
            className="accent-verde"
          />
          <span className="text-[12.5px] text-texto">Carta de Habitação emitida</span>
        </label>

        {descontoSemCartaHabitacao ? (
          <p className="rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12px] text-ambar">
            Sem Carta de Habitação o desconto de IPTU não se efetiva — a certificação e o ganho
            de altura seguem valendo.
          </p>
        ) : null}

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
            Observações
          </span>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            placeholder="exigência de complementação, motivo de cancelamento…"
            className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[12.5px] text-texto"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || !obraId}
            className="rounded-sm border border-verde px-3 py-1.5 font-display text-[12.5px] font-semibold text-verde transition-colors hover:bg-verde-claro disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar trâmite"}
          </button>
          {aviso ? <span className="text-[12px] text-texto-fraco">{aviso}</span> : null}
        </div>
      </div>
    </Card>
  );
}

function CampoData({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
        {rotulo}
      </span>
      <input
        type="date"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[12.5px] text-texto"
      />
    </label>
  );
}

function CampoNumero({
  rotulo,
  valor,
  onChange,
  placeholder,
}: {
  rotulo: string;
  valor: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
        {rotulo}
      </span>
      <input
        type="number"
        min={0}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="mt-1 w-full rounded-sm border border-linha bg-papel px-2 py-1.5 text-[13px] text-texto"
      />
    </label>
  );
}
