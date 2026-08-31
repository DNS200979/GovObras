import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// ESG — projetos enviados pelas construtoras
// ============================================================

export const categoriaEsgLabel: Record<string, string> = {
  ambiental: "Ambiental",
  social: "Social",
  governanca: "Governança",
};

export const statusEsgLabel: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export interface ProjetoEsgResumo {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  obra: string;
  construtora: string;
  enviadoEm: string | null;
  createdAt: string;
  requisitoCodigo: string | null;
}

interface ProjetoEsgListRow {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  enviado_em: string | null;
  created_at: string;
  obras: { nome: string; construtoras: { razao_social: string } | null } | null;
  requisitos_auditoria: { codigo: string } | null;
}

export async function listProjetosEsg(): Promise<ProjetoEsgResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_esg")
    .select(
      "id, titulo, categoria, status, enviado_em, created_at, obras(nome, construtoras(razao_social)), requisitos_auditoria(codigo)",
    )
    .neq("status", "rascunho")
    .order("enviado_em", { ascending: false, nullsFirst: false })
    .returns<ProjetoEsgListRow[]>();
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    categoria: p.categoria,
    status: p.status,
    obra: p.obras?.nome ?? "—",
    construtora: p.obras?.construtoras?.razao_social ?? "—",
    enviadoEm: p.enviado_em,
    createdAt: p.created_at,
    requisitoCodigo: p.requisitos_auditoria?.codigo ?? null,
  }));
}

export interface ProjetoEsgDocumentoGov {
  id: string;
  nomeArquivo: string;
  tamanhoBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ProjetoEsgDetalheGov {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  obra: string;
  alvaraNumero: string;
  construtora: string;
  enviadoEm: string | null;
  decidoEm: string | null;
  motivoDecisao: string | null;
  requisito: { codigo: string; requisito: string; natureza: string } | null;
  documentos: ProjetoEsgDocumentoGov[];
}

interface ProjetoEsgDetalheRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  enviado_em: string | null;
  decidido_em: string | null;
  motivo_decisao: string | null;
  obras: { nome: string; alvara_numero: string; construtoras: { razao_social: string } | null } | null;
  requisitos_auditoria: { codigo: string; requisito: string; natureza: string } | null;
  projeto_esg_documentos: {
    id: string;
    nome_arquivo: string;
    storage_path: string;
    tamanho_bytes: number | null;
    created_at: string;
  }[];
}

export async function getProjetoEsgGov(id: string): Promise<ProjetoEsgDetalheGov | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_esg")
    .select(
      "id, titulo, descricao, categoria, status, enviado_em, decidido_em, motivo_decisao, obras(nome, alvara_numero, construtoras(razao_social)), requisitos_auditoria(codigo, requisito, natureza), projeto_esg_documentos(id, nome_arquivo, storage_path, tamanho_bytes, created_at)",
    )
    .eq("id", id)
    .single<ProjetoEsgDetalheRow>();
  if (error) return null;

  const documentos = await Promise.all(
    (data.projeto_esg_documentos ?? []).map(async (doc) => {
      const { data: signed } = await db.storage
        .from("projetos-esg-docs")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return {
        id: doc.id,
        nomeArquivo: doc.nome_arquivo,
        tamanhoBytes: doc.tamanho_bytes,
        createdAt: doc.created_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );

  return {
    id: data.id,
    titulo: data.titulo,
    descricao: data.descricao,
    categoria: data.categoria,
    status: data.status,
    obra: data.obras?.nome ?? "—",
    alvaraNumero: data.obras?.alvara_numero ?? "—",
    construtora: data.obras?.construtoras?.razao_social ?? "—",
    enviadoEm: data.enviado_em,
    decidoEm: data.decidido_em,
    motivoDecisao: data.motivo_decisao,
    requisito: data.requisitos_auditoria,
    documentos,
  };
}
