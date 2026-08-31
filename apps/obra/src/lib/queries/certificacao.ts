import { createServerSupabase } from "@carbonfree/database/server";
import type {
  CodigoDimensao,
  StatusBeneficioFiscal,
  StatusCertificacao,
} from "../certificacao-poa";

// ============================================================
// Certificação municipal — acompanhamento do trâmite pela construtora
// ============================================================

/** Só existe catálogo escrito para este programa hoje (ver `certificacao-poa.ts`). */
export const PROGRAMA_POA = "poa_sustentabilidade_ambiental";

export type NivelSeloPersistido = "bronze" | "prata" | "ouro" | "diamante";

export interface ItemCertificacao {
  criterioCodigo: string;
  dimensao: CodigoDimensao;
  pontos: number;
  faixa: string | null;
  documentoAnexado: boolean;
  validado: boolean;
  validadeDocumento: string | null;
  responsavel: string | null;
}

export interface CertificacaoObra {
  id: string;
  obraId: string;
  statusCertificacao: StatusCertificacao;
  statusBeneficioFiscal: StatusBeneficioFiscal;
  protocolo: string | null;
  nivelPretendido: NivelSeloPersistido | null;
  nivelObtido: NivelSeloPersistido | null;
  protocoladaEm: string | null;
  emitidoEm: string | null;
  validade: string | null;
  cartaHabitacaoEmitida: boolean;
  exercicioBeneficio: number | null;
  iptuAnualReferencia: number | null;
  alturaBasicaM: number | null;
  observacoes: string | null;
  atualizadoEm: string;
  itens: ItemCertificacao[];
}

/**
 * O banco declara os status como `text` com `check`. A união é garantida pelo
 * Postgres; o tipo gerado só não consegue expressá-la — mesmo tratamento que
 * `esg.ts` dá a `natureza`.
 */
const comoStatusCertificacao = (v: string) => v as StatusCertificacao;
const comoStatusBeneficio = (v: string) => v as StatusBeneficioFiscal;
const comoNivel = (v: string | null) => (v as NivelSeloPersistido | null) ?? null;
const comoDimensao = (v: string) => v as CodigoDimensao;

/**
 * Certificação vigente da obra neste programa.
 *
 * Renovação cria linha nova apontando para a anterior (IN SMAMUS nº 001/2026),
 * então "a atual" é a mais recente — o histórico fica preservado para a
 * vistoria por amostragem.
 */
export async function getCertificacaoDaObra(
  obraId: string,
  programa: string = PROGRAMA_POA,
): Promise<CertificacaoObra | null> {
  const db = await createServerSupabase();
  // A projeção precisa ser um literal único: o supabase-js infere o tipo do
  // retorno a partir dela, e concatenação com `+` a reduz a `string`.
  const { data, error } = await db
    .from("certificacoes_municipais")
    .select(
      "id, obra_id, status_certificacao, status_beneficio_fiscal, protocolo, nivel_pretendido, nivel_obtido, protocolada_em, emitido_em, validade, carta_habitacao_emitida, exercicio_beneficio, iptu_anual_referencia, altura_basica_m, observacoes, updated_at, certificacao_itens(criterio_codigo, dimensao, pontos, faixa, documento_anexado, validado, validade_documento, responsavel)",
    )
    .eq("obra_id", obraId)
    .eq("programa", programa)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    obraId: data.obra_id,
    statusCertificacao: comoStatusCertificacao(data.status_certificacao),
    statusBeneficioFiscal: comoStatusBeneficio(data.status_beneficio_fiscal),
    protocolo: data.protocolo,
    nivelPretendido: comoNivel(data.nivel_pretendido),
    nivelObtido: comoNivel(data.nivel_obtido),
    protocoladaEm: data.protocolada_em,
    emitidoEm: data.emitido_em,
    validade: data.validade,
    cartaHabitacaoEmitida: data.carta_habitacao_emitida,
    exercicioBeneficio: data.exercicio_beneficio,
    iptuAnualReferencia:
      data.iptu_anual_referencia === null ? null : Number(data.iptu_anual_referencia),
    alturaBasicaM: data.altura_basica_m === null ? null : Number(data.altura_basica_m),
    observacoes: data.observacoes,
    atualizadoEm: data.updated_at,
    itens: (data.certificacao_itens ?? []).map((i) => ({
      criterioCodigo: i.criterio_codigo,
      dimensao: comoDimensao(i.dimensao),
      pontos: Number(i.pontos),
      faixa: i.faixa,
      documentoAnexado: i.documento_anexado,
      validado: i.validado,
      validadeDocumento: i.validade_documento,
      responsavel: i.responsavel,
    })),
  };
}
