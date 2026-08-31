import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// Concreteiras — vínculo, entregas e ESG (visão da construtora)
// ============================================================

export interface ConcreteiraVinculo {
  id: string; // obra_concreteiras.id
  concreteiraId: string;
  razaoSocial: string;
  cnpj: string;
  obraId: string;
  obraNome: string;
  status: string;
  totalEntregas: number;
  createdAt: string;
}

interface ConcreteiraVinculoRow {
  id: string;
  status: string;
  created_at: string;
  obras: { id: string; nome: string } | null;
  concreteiras: { id: string; razao_social: string; cnpj: string } | null;
  entregas_concreto: { id: string }[];
}

export async function listConcreteirasVinculadas(): Promise<ConcreteiraVinculo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obra_concreteiras")
    .select(
      "id, status, created_at, obras(id, nome), concreteiras(id, razao_social, cnpj), entregas_concreto(id)",
    )
    .order("created_at", { ascending: false })
    .returns<ConcreteiraVinculoRow[]>();
  if (error) throw error;

  return (data ?? []).map((v) => ({
    id: v.id,
    concreteiraId: v.concreteiras?.id ?? "",
    razaoSocial: v.concreteiras?.razao_social ?? "",
    cnpj: v.concreteiras?.cnpj ?? "",
    obraId: v.obras?.id ?? "",
    obraNome: v.obras?.nome ?? "",
    status: v.status,
    totalEntregas: (v.entregas_concreto ?? []).length,
    createdAt: v.created_at,
  }));
}

export interface EntregaConcretoResumo {
  id: string;
  volumeM3: number;
  traco: string | null;
  dataEntrega: string;
  status: string;
  temEvidencia: boolean;
  materializadoEm: string | null;
  composicao: { insumo: string; quantidade: number; unidade: string; fatorCategoria: string | null }[];
}

export interface ConcreteiraEsgPublicado {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  createdAt: string;
}

export interface ConcreteiraNaObra {
  vinculoId: string;
  status: string;
  razaoSocial: string;
  cnpj: string;
  obraNome: string;
  entregas: EntregaConcretoResumo[];
  esgPublicados: ConcreteiraEsgPublicado[];
}

interface EntregaConcretoRow {
  id: string;
  volume_m3: number;
  traco: string | null;
  data_entrega: string;
  status: string;
  evidencia_id: string | null;
  materializado_em: string | null;
  entrega_composicao: {
    insumo: string;
    quantidade: number;
    unidade: string;
    fatores_emissao: { categoria: string } | null;
  }[];
}

/** Detalhe de um vínculo obra×concreteira — `id` é o de `obra_concreteiras`. */
export async function getConcreteiraNaObra(id: string): Promise<ConcreteiraNaObra | null> {
  const db = await createServerSupabase();

  const { data: vinculo, error: vincErr } = await db
    .from("obra_concreteiras")
    .select("id, status, obras(nome), concreteiras(id, razao_social, cnpj)")
    .eq("id", id)
    .single<{
      id: string;
      status: string;
      obras: { nome: string } | null;
      concreteiras: { id: string; razao_social: string; cnpj: string } | null;
    }>();
  if (vincErr || !vinculo?.concreteiras) return null;

  const [{ data: entregas }, { data: esg }] = await Promise.all([
    db
      .from("entregas_concreto")
      .select(
        "id, volume_m3, traco, data_entrega, status, evidencia_id, materializado_em, entrega_composicao(insumo, quantidade, unidade, fatores_emissao(categoria))",
      )
      .eq("obra_concreteira_id", id)
      .order("data_entrega", { ascending: false })
      .returns<EntregaConcretoRow[]>(),
    db
      .from("concreteira_esg")
      .select("id, titulo, descricao, categoria, created_at")
      .eq("concreteira_id", vinculo.concreteiras.id)
      .eq("status", "publicado")
      .order("created_at", { ascending: false }),
  ]);

  return {
    vinculoId: vinculo.id,
    status: vinculo.status,
    razaoSocial: vinculo.concreteiras.razao_social,
    cnpj: vinculo.concreteiras.cnpj,
    obraNome: vinculo.obras?.nome ?? "",
    entregas: (entregas ?? []).map((e) => ({
      id: e.id,
      volumeM3: Number(e.volume_m3),
      traco: e.traco,
      dataEntrega: e.data_entrega,
      status: e.status,
      temEvidencia: e.evidencia_id !== null,
      materializadoEm: e.materializado_em,
      composicao: (e.entrega_composicao ?? []).map((c) => ({
        insumo: c.insumo,
        quantidade: Number(c.quantidade),
        unidade: c.unidade,
        fatorCategoria: c.fatores_emissao?.categoria ?? null,
      })),
    })),
    esgPublicados: (esg ?? []).map((p) => ({
      id: p.id,
      titulo: p.titulo,
      descricao: p.descricao,
      categoria: p.categoria,
      createdAt: p.created_at,
    })),
  };
}
