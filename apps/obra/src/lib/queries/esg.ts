import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// ESG — projetos, documentos e processo de desconto fiscal
// ============================================================

export interface ObraResumo {
  id: string;
  nome: string;
  alvaraNumero: string;
}

export async function listObrasConstrutora(): Promise<ObraResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db.from("obras").select("id, nome, alvara_numero").order("nome");
  if (error) throw error;
  return (data ?? []).map((o) => ({ id: o.id, nome: o.nome, alvaraNumero: o.alvara_numero }));
}

/**
 * O banco declara `natureza` como `text`, mas a coluna tem
 * `check (natureza in ('passivo','ativo'))` — a união é garantida pelo
 * Postgres, e o tipo gerado só não consegue expressar isso.
 */
type Natureza = "passivo" | "ativo";
const comoNatureza = (v: string): Natureza => v as Natureza;

export interface RequisitoResumo {
  id: string;
  codigo: string;
  requisito: string;
  natureza: "passivo" | "ativo";
}

/** Catálogo cadastrado pela prefeitura em "Requisitos auditáveis" — leitura liberada pra qualquer autenticado. */
export async function listRequisitosAuditoria(): Promise<RequisitoResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("requisitos_auditoria")
    .select("id, codigo, requisito, natureza")
    .order("natureza")
    .order("ordem");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    codigo: r.codigo,
    requisito: r.requisito,
    natureza: comoNatureza(r.natureza),
  }));
}

export interface RequisitoGuia {
  id: string;
  codigo: string;
  requisito: string;
  natureza: "passivo" | "ativo";
  unidade: string;
  evidenciaPrimaria: string;
  testeVerificacao: string;
}

/**
 * Mesmo catálogo de `listRequisitosAuditoria`, mas com o campo de evidência
 * e verificação — é o que dá conteúdo de verdade pro Guia ESG (o que
 * exatamente precisa ser anexado pra cada tipo de ação). Exclui o
 * "TESTE" (dado de desenvolvimento, marcado "(apagar)" no próprio texto —
 * filtrado aqui em vez de esconder no cadastro da prefeitura, que não é
 * escopo deste app).
 */
export async function listRequisitosParaGuia(): Promise<RequisitoGuia[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("requisitos_auditoria")
    .select("id, codigo, requisito, natureza, unidade, evidencia_primaria, teste_verificacao")
    .order("natureza")
    .order("ordem");
  if (error) throw error;
  return (data ?? [])
    .filter((r) => r.codigo !== "TESTE")
    .map((r) => ({
      id: r.id,
      codigo: r.codigo,
      requisito: r.requisito,
      natureza: comoNatureza(r.natureza),
      unidade: r.unidade,
      evidenciaPrimaria: r.evidencia_primaria,
      testeVerificacao: r.teste_verificacao,
    }));
}

const categoriaLabel: Record<string, string> = {
  ambiental: "Ambiental",
  social: "Social",
  governanca: "Governança",
};

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export { categoriaLabel, statusLabel };

export interface ProjetoEsgResumo {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  obraId: string;
  obraNome: string;
  createdAt: string;
  requisitoCodigo: string | null;
}

interface ProjetoEsgRow {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  created_at: string;
  obras: { id: string; nome: string } | null;
  requisitos_auditoria: { codigo: string } | null;
}

export async function listProjetosEsg(): Promise<ProjetoEsgResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_esg")
    .select("id, titulo, categoria, status, created_at, obras(id, nome), requisitos_auditoria(codigo)")
    .order("created_at", { ascending: false })
    .returns<ProjetoEsgRow[]>();
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    categoria: p.categoria,
    status: p.status,
    obraId: p.obras?.id ?? "",
    obraNome: p.obras?.nome ?? "",
    createdAt: p.created_at,
    requisitoCodigo: p.requisitos_auditoria?.codigo ?? null,
  }));
}

export interface ProjetoEsgDocumento {
  id: string;
  nomeArquivo: string;
  storagePath: string;
  tamanhoBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ProjetoEsgDetalhe {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  obraId: string;
  obraNome: string;
  createdAt: string;
  motivoDecisao: string | null;
  requisito: { codigo: string; requisito: string } | null;
  documentos: ProjetoEsgDocumento[];
}

interface ProjetoEsgDetalheRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  created_at: string;
  motivo_decisao: string | null;
  obras: { id: string; nome: string } | null;
  requisitos_auditoria: { codigo: string; requisito: string } | null;
  projeto_esg_documentos: {
    id: string;
    nome_arquivo: string;
    storage_path: string;
    tamanho_bytes: number | null;
    created_at: string;
  }[];
}


export async function getProjetoEsg(id: string): Promise<ProjetoEsgDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_esg")
    .select(
      "id, titulo, descricao, categoria, status, created_at, motivo_decisao, obras(id, nome), requisitos_auditoria(codigo, requisito), projeto_esg_documentos(id, nome_arquivo, storage_path, tamanho_bytes, created_at)",
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
        storagePath: doc.storage_path,
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
    obraId: data.obras?.id ?? "",
    obraNome: data.obras?.nome ?? "",
    createdAt: data.created_at,
    motivoDecisao: data.motivo_decisao,
    requisito: data.requisitos_auditoria,
    documentos,
  };
}
