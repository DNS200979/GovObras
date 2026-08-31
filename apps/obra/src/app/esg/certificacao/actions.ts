"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";
import { PROGRAMA_POA } from "@/lib/queries";
import {
  exercicioDoBeneficio,
  type CodigoDimensao,
  type StatusBeneficioFiscal,
  type StatusCertificacao,
} from "@/lib/certificacao-poa";

export interface ResultadoAcao {
  error?: string;
  ok?: boolean;
}

export interface ItemQuadro {
  criterioCodigo: string;
  dimensao: CodigoDimensao;
  pontos: number;
  faixa: string | null;
}

/**
 * Garante a certificação da obra e devolve o id.
 *
 * A construtora não "cria" uma certificação como ato separado — ela começa a
 * preencher o quadro, e é isso que a existência da linha registra. Por isso o
 * primeiro salvamento cria em `em_preparacao` em vez de exigir um botão a mais.
 */
async function garantirCertificacao(
  db: Awaited<ReturnType<typeof createServerSupabase>>,
  obraId: string,
  construtoraId: string,
  userId: string,
): Promise<{ id: string } | { error: string }> {
  const { data: existente } = await db
    .from("certificacoes_municipais")
    .select("id")
    .eq("obra_id", obraId)
    .eq("programa", PROGRAMA_POA)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente) return { id: existente.id };

  const { data, error } = await db
    .from("certificacoes_municipais")
    .insert({
      obra_id: obraId,
      construtora_id: construtoraId,
      programa: PROGRAMA_POA,
      status_certificacao: "em_preparacao",
      criado_por: userId,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível iniciar a certificação: " + error.message };
  return { id: data.id };
}

export async function salvarQuadro(input: {
  obraId: string;
  iptuAnual: number | null;
  alturaBasicaM: number | null;
  nivelPretendido: string | null;
  itens: ItemQuadro[];
}): Promise<ResultadoAcao> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };
  if (!input.obraId) return { error: "Selecione a obra." };

  const cert = await garantirCertificacao(db, input.obraId, sessao.construtoraId, sessao.userId);
  if ("error" in cert) return { error: cert.error };

  const { error: erroCabecalho } = await db
    .from("certificacoes_municipais")
    .update({
      iptu_anual_referencia: input.iptuAnual,
      altura_basica_m: input.alturaBasicaM,
      nivel_pretendido: input.nivelPretendido,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cert.id);
  if (erroCabecalho) return { error: "Não foi possível salvar: " + erroCabecalho.message };

  const pontuados = input.itens.filter((i) => i.pontos > 0);

  if (pontuados.length > 0) {
    // Upsert em vez de apagar-e-recriar: `documento_anexado`, `validado`,
    // `validade_documento` e `responsavel` são preenchidos noutro fluxo, e
    // recriar a linha os zeraria em silêncio.
    const { error } = await db.from("certificacao_itens").upsert(
      pontuados.map((i) => ({
        certificacao_id: cert.id,
        criterio_codigo: i.criterioCodigo,
        dimensao: i.dimensao,
        pontos: i.pontos,
        faixa: i.faixa,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "certificacao_id,criterio_codigo" },
    );
    if (error) return { error: "Não foi possível salvar os critérios: " + error.message };
  }

  // Critério despontuado sai do quadro — deixar a linha com 0 confundiria o
  // checklist de documentos, que lê justamente "o que foi pontuado".
  const manter = pontuados.map((i) => i.criterioCodigo);
  const remocao = db.from("certificacao_itens").delete().eq("certificacao_id", cert.id);
  const { error: erroRemocao } = await (manter.length > 0
    ? remocao.not("criterio_codigo", "in", `(${manter.map((c) => `"${c}"`).join(",")})`)
    : remocao);
  if (erroRemocao) return { error: "Não foi possível limpar os critérios: " + erroRemocao.message };

  revalidatePath("/esg/certificacao");
  return { ok: true };
}

export async function atualizarTramite(input: {
  obraId: string;
  statusCertificacao: StatusCertificacao;
  statusBeneficioFiscal: StatusBeneficioFiscal;
  protocolo: string | null;
  protocoladaEm: string | null;
  emitidoEm: string | null;
  validade: string | null;
  nivelObtido: string | null;
  cartaHabitacaoEmitida: boolean;
  observacoes: string | null;
}): Promise<ResultadoAcao> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  // O banco tem `certificacao_cancelada_tem_motivo`. Barrar aqui devolve uma
  // frase útil em vez do texto de violação de constraint.
  if (input.statusCertificacao === "cancelada" && !input.observacoes?.trim()) {
    return { error: "Cancelamento exige motivo registrado nas observações." };
  }

  const cert = await garantirCertificacao(db, input.obraId, sessao.construtoraId, sessao.userId);
  if ("error" in cert) return { error: cert.error };

  const { error } = await db
    .from("certificacoes_municipais")
    .update({
      status_certificacao: input.statusCertificacao,
      status_beneficio_fiscal: input.statusBeneficioFiscal,
      protocolo: input.protocolo,
      protocolada_em: input.protocoladaEm,
      emitido_em: input.emitidoEm,
      validade: input.validade,
      nivel_obtido: input.nivelObtido,
      carta_habitacao_emitida: input.cartaHabitacaoEmitida,
      // Derivado da data de protocolo pela regra do Decreto nº 23.226/2025 —
      // é conta de calendário, não escolha do usuário.
      exercicio_beneficio: input.protocoladaEm
        ? exercicioDoBeneficio(new Date(`${input.protocoladaEm}T12:00:00`))
        : null,
      observacoes: input.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cert.id);

  if (error) return { error: "Não foi possível atualizar o trâmite: " + error.message };

  revalidatePath("/esg/certificacao");
  return { ok: true };
}
