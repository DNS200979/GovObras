import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// Concreteiras — visibilidade da prefeitura sobre a cadeia de suprimento
// (RLS escopa por município via obra_concreteiras/obras — ver migration 28)
// ============================================================

export interface ConcreteiraGovResumo {
  id: string;
  razaoSocial: string;
  cnpj: string;
  totalObras: number;
  totalEntregas: number;
}

export async function listConcreteirasMunicipio(): Promise<ConcreteiraGovResumo[]> {
  const db = await createServerSupabase();
  const { data: concreteiras, error } = await db
    .from("concreteiras")
    .select("id, razao_social, cnpj")
    .order("razao_social");
  if (error) throw error;

  const [{ data: vinculos }, { data: entregas }] = await Promise.all([
    db.from("obra_concreteiras").select("concreteira_id, obra_id"),
    db.from("entregas_concreto").select("concreteira_id"),
  ]);

  const obrasPorConcreteira = new Map<string, Set<string>>();
  for (const v of vinculos ?? []) {
    if (!obrasPorConcreteira.has(v.concreteira_id)) obrasPorConcreteira.set(v.concreteira_id, new Set());
    obrasPorConcreteira.get(v.concreteira_id)!.add(v.obra_id);
  }
  const entregasPorConcreteira = new Map<string, number>();
  for (const e of entregas ?? []) {
    entregasPorConcreteira.set(e.concreteira_id, (entregasPorConcreteira.get(e.concreteira_id) ?? 0) + 1);
  }

  return (concreteiras ?? []).map((c) => ({
    id: c.id,
    razaoSocial: c.razao_social,
    cnpj: c.cnpj,
    totalObras: obrasPorConcreteira.get(c.id)?.size ?? 0,
    totalEntregas: entregasPorConcreteira.get(c.id) ?? 0,
  }));
}

export interface ConcreteiraGovEntrega {
  id: string;
  obraNome: string;
  volumeM3: number;
  dataEntrega: string;
  status: string;
  materializadoEm: string | null;
  composicao: { insumo: string; quantidade: number; unidade: string; fatorCategoria: string | null }[];
}

interface ConcreteiraGovEntregaRow {
  id: string;
  volume_m3: number;
  data_entrega: string;
  status: string;
  materializado_em: string | null;
  obras: { nome: string } | null;
  entrega_composicao: {
    insumo: string;
    quantidade: number;
    unidade: string;
    fatores_emissao: { categoria: string } | null;
  }[];
}

export interface ConcreteiraGovEsg {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
}

export interface ConcreteiraGovDetalhe {
  id: string;
  razaoSocial: string;
  cnpj: string;
  entregas: ConcreteiraGovEntrega[];
  esgPublicados: ConcreteiraGovEsg[];
}

export async function getConcreteiraGov(id: string): Promise<ConcreteiraGovDetalhe | null> {
  const db = await createServerSupabase();
  const { data: concreteira, error } = await db
    .from("concreteiras")
    .select("id, razao_social, cnpj")
    .eq("id", id)
    .single();
  if (error || !concreteira) return null;

  const [{ data: entregas }, { data: esg }] = await Promise.all([
    db
      .from("entregas_concreto")
      .select(
        "id, volume_m3, data_entrega, status, materializado_em, obras(nome), entrega_composicao(insumo, quantidade, unidade, fatores_emissao(categoria))",
      )
      .eq("concreteira_id", id)
      .order("data_entrega", { ascending: false })
      .returns<ConcreteiraGovEntregaRow[]>(),
    db
      .from("concreteira_esg")
      .select("id, titulo, descricao, categoria")
      .eq("concreteira_id", id)
      .eq("status", "publicado")
      .order("created_at", { ascending: false }),
  ]);

  return {
    id: concreteira.id,
    razaoSocial: concreteira.razao_social,
    cnpj: concreteira.cnpj,
    entregas: (entregas ?? []).map((e) => ({
      id: e.id,
      obraNome: e.obras?.nome ?? "—",
      volumeM3: Number(e.volume_m3),
      dataEntrega: e.data_entrega,
      status: e.status,
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
    })),
  };
}
