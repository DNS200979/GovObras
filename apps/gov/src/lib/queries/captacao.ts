import { createServerSupabase } from "@carbonfree/database/server";
import type { Resposta, SituacaoDoc } from "../financiamento";
import { calcularDiagnostico } from "../financiamento";

// ============================================================
// Financiamento climático — projetos de captação e diagnóstico
// ============================================================

export interface ProjetoCaptacaoResumo {
  id: string;
  nome: string;
  tema: string;
  situacao: string;
  valorEstimadoBrl: number | null;
  prontidaoPct: number;
  classificacao: string;
  respondidas: number;
  createdAt: string;
}

export async function listProjetosCaptacao(): Promise<ProjetoCaptacaoResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_captacao")
    .select("id, nome, tema, situacao, valor_estimado_brl, created_at, diagnostico_respostas(questao_id, resposta)")
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        nome: string;
        tema: string;
        situacao: string;
        valor_estimado_brl: number | null;
        created_at: string;
        diagnostico_respostas: { questao_id: number; resposta: Resposta }[];
      }[]
    >();
  if (error) throw error;

  return (data ?? []).map((p) => {
    const mapa = new Map<number, Resposta>(
      (p.diagnostico_respostas ?? []).map((r) => [r.questao_id, r.resposta]),
    );
    const d = calcularDiagnostico(mapa);
    return {
      id: p.id,
      nome: p.nome,
      tema: p.tema,
      situacao: p.situacao,
      valorEstimadoBrl: p.valor_estimado_brl,
      prontidaoPct: d.prontidaoPct,
      classificacao: d.classificacao,
      respondidas: d.respondidas,
      createdAt: p.created_at,
    };
  });
}

export interface RespostaSalva {
  questaoId: number;
  resposta: Resposta;
  evidencia: string | null;
  origem: string;
}

export interface ProjetoCaptacaoDetalhe {
  id: string;
  nome: string;
  descricao: string;
  tema: string;
  situacao: string;
  valorEstimadoBrl: number | null;
  respostas: RespostaSalva[];
  diagnostico: ReturnType<typeof calcularDiagnostico>;
}

export async function getProjetoCaptacao(id: string): Promise<ProjetoCaptacaoDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_captacao")
    .select("id, nome, descricao, tema, situacao, valor_estimado_brl, diagnostico_respostas(questao_id, resposta, evidencia, origem)")
    .eq("id", id)
    .single<{
      id: string;
      nome: string;
      descricao: string;
      tema: string;
      situacao: string;
      valor_estimado_brl: number | null;
      diagnostico_respostas: {
        questao_id: number;
        resposta: Resposta;
        evidencia: string | null;
        origem: string;
      }[];
    }>();
  if (error) return null;

  const respostas: RespostaSalva[] = (data.diagnostico_respostas ?? []).map((r) => ({
    questaoId: r.questao_id,
    resposta: r.resposta,
    evidencia: r.evidencia,
    origem: r.origem,
  }));

  const mapa = new Map<number, Resposta>(respostas.map((r) => [r.questaoId, r.resposta]));

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    tema: data.tema,
    situacao: data.situacao,
    valorEstimadoBrl: data.valor_estimado_brl,
    respostas,
    diagnostico: calcularDiagnostico(mapa),
  };
}

export interface DocumentoProjeto {
  documentoId: number;
  situacao: SituacaoDoc;
  observacao: string | null;
  nomeArquivo: string | null;
  storagePath: string | null;
  updatedAt: string;
}

export async function listDocumentosProjeto(projetoId: string): Promise<DocumentoProjeto[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projeto_documentos")
    .select("documento_id, situacao, observacao, nome_arquivo, storage_path, updated_at")
    .eq("projeto_id", projetoId);
  if (error) throw error;

  return (data ?? []).map((d) => ({
    documentoId: d.documento_id,
    situacao: d.situacao as SituacaoDoc,
    observacao: d.observacao,
    nomeArquivo: d.nome_arquivo,
    storagePath: d.storage_path,
    updatedAt: d.updated_at,
  }));
}

/** URL temporária para baixar o anexo; o bucket é privado. */
export async function urlDoAnexo(storagePath: string): Promise<string | null> {
  const db = await createServerSupabase();
  const { data } = await db.storage.from("captacao-docs").createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}
