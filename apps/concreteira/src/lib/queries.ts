import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// Obras vinculadas
// ============================================================

export interface ObraVinculada {
  vinculoId: string;
  obraId: string;
  obraNome: string;
  alvaraNumero: string;
  status: string;
  totalEntregas: number;
}

interface ObraVinculadaRow {
  id: string;
  status: string;
  obras: { id: string; nome: string; alvara_numero: string } | null;
  entregas_concreto: { id: string }[];
}

export async function listObrasVinculadas(): Promise<ObraVinculada[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obra_concreteiras")
    .select("id, status, obras(id, nome, alvara_numero), entregas_concreto(id)")
    .order("created_at", { ascending: false })
    .returns<ObraVinculadaRow[]>();
  if (error) throw error;

  return (data ?? []).map((v) => ({
    vinculoId: v.id,
    obraId: v.obras?.id ?? "",
    obraNome: v.obras?.nome ?? "",
    alvaraNumero: v.obras?.alvara_numero ?? "",
    status: v.status,
    totalEntregas: (v.entregas_concreto ?? []).length,
  }));
}

/** Só os vínculos ativos — é o que entra no seletor de "nova entrega". */
export async function listObrasVinculadasAtivas(): Promise<ObraVinculada[]> {
  const obras = await listObrasVinculadas();
  return obras.filter((o) => o.status === "ativo");
}

// ============================================================
// Fatores de emissão — catálogo pra vincular à composição declarada
// ============================================================

export interface FatorEmissao {
  id: string;
  categoria: string;
  valor: number;
  unidade: string;
}

/** Catálogo global (fatores_emissao) — leitura liberada pra qualquer autenticado. */
export async function listFatoresEmissao(): Promise<FatorEmissao[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("fatores_emissao")
    .select("id, categoria, valor, unidade")
    .order("categoria");
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    categoria: f.categoria,
    valor: Number(f.valor),
    unidade: f.unidade,
  }));
}

// ============================================================
// Entregas — rastreabilidade de mistura por carga
// ============================================================

export interface EntregaListItem {
  id: string;
  obraNome: string;
  volumeM3: number;
  dataEntrega: string;
  status: string;
  totalInsumos: number;
  materializadoEm: string | null;
}

interface EntregaListRow {
  id: string;
  volume_m3: number;
  data_entrega: string;
  status: string;
  materializado_em: string | null;
  obras: { nome: string } | null;
  entrega_composicao: { id: string }[];
}

export async function listEntregas(): Promise<EntregaListItem[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("entregas_concreto")
    .select("id, volume_m3, data_entrega, status, materializado_em, obras(nome), entrega_composicao(id)")
    .order("data_entrega", { ascending: false })
    .returns<EntregaListRow[]>();
  if (error) throw error;

  return (data ?? []).map((e) => ({
    id: e.id,
    obraNome: e.obras?.nome ?? "",
    volumeM3: Number(e.volume_m3),
    dataEntrega: e.data_entrega,
    status: e.status,
    totalInsumos: (e.entrega_composicao ?? []).length,
    materializadoEm: e.materializado_em,
  }));
}

export interface EntregaDetalhe {
  id: string;
  obraNome: string;
  volumeM3: number;
  traco: string | null;
  dataEntrega: string;
  status: string;
  temEvidencia: boolean;
  materializadoEm: string | null;
  composicao: { id: string; insumo: string; quantidade: number; unidade: string; fatorCategoria: string | null }[];
}

interface EntregaDetalheRow {
  id: string;
  volume_m3: number;
  traco: string | null;
  data_entrega: string;
  status: string;
  evidencia_id: string | null;
  materializado_em: string | null;
  obras: { nome: string } | null;
  entrega_composicao: {
    id: string;
    insumo: string;
    quantidade: number;
    unidade: string;
    fatores_emissao: { categoria: string } | null;
  }[];
}

export async function getEntrega(id: string): Promise<EntregaDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("entregas_concreto")
    .select(
      "id, volume_m3, traco, data_entrega, status, evidencia_id, materializado_em, obras(nome), entrega_composicao(id, insumo, quantidade, unidade, fatores_emissao(categoria))",
    )
    .eq("id", id)
    .single<EntregaDetalheRow>();
  if (error) return null;

  return {
    id: data.id,
    obraNome: data.obras?.nome ?? "",
    volumeM3: Number(data.volume_m3),
    traco: data.traco,
    dataEntrega: data.data_entrega,
    status: data.status,
    temEvidencia: data.evidencia_id !== null,
    materializadoEm: data.materializado_em,
    composicao: (data.entrega_composicao ?? []).map((c) => ({
      id: c.id,
      insumo: c.insumo,
      quantidade: Number(c.quantidade),
      unidade: c.unidade,
      fatorCategoria: c.fatores_emissao?.categoria ?? null,
    })),
  };
}

// ============================================================
// ESG da concreteira — scorecard qualitativo
// ============================================================

const categoriaLabel: Record<string, string> = {
  ambiental: "Ambiental",
  social: "Social",
  governanca: "Governança",
};

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
};

export { categoriaLabel, statusLabel };

export interface ConcreteiraEsgItem {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  createdAt: string;
}

export async function listConcreteiraEsg(): Promise<ConcreteiraEsgItem[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("concreteira_esg")
    .select("id, titulo, categoria, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    categoria: p.categoria,
    status: p.status,
    createdAt: p.created_at,
  }));
}

export interface ConcreteiraEsgDocumento {
  id: string;
  nomeArquivo: string;
  storagePath: string;
  tamanhoBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ConcreteiraEsgDetalhe {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  createdAt: string;
  documentos: ConcreteiraEsgDocumento[];
}

interface ConcreteiraEsgDetalheRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  created_at: string;
  concreteira_esg_documentos: {
    id: string;
    nome_arquivo: string;
    storage_path: string;
    tamanho_bytes: number | null;
    created_at: string;
  }[];
}

export async function getConcreteiraEsgItem(id: string): Promise<ConcreteiraEsgDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("concreteira_esg")
    .select(
      "id, titulo, descricao, categoria, status, created_at, concreteira_esg_documentos(id, nome_arquivo, storage_path, tamanho_bytes, created_at)",
    )
    .eq("id", id)
    .single<ConcreteiraEsgDetalheRow>();
  if (error) return null;

  const documentos = await Promise.all(
    (data.concreteira_esg_documentos ?? []).map(async (doc) => {
      const { data: signed } = await db.storage
        .from("concreteira-esg-docs")
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
    createdAt: data.created_at,
    documentos,
  };
}
