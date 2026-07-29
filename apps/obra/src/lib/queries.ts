import { createAdminClient } from "@carbonfree/database/admin";

/**
 * Leituras server-side com service role (bypassa RLS) — mesmo motivo do
 * apps/gov/src/lib/queries.ts.
 *
 * Sem autenticação ainda, não há como saber "qual construtora está
 * logada" — então esta camada foca numa única obra de demonstração
 * (Residencial Vista Verde). Quando o login existir, trocar por uma
 * consulta escopada por `construtora_id` da sessão.
 */
const ALVARA_EM_FOCO = "ALV-2025-1042";

export async function getObraAtual() {
  const db = createAdminClient();

  const { data: obra, error: obraErr } = await db
    .from("obras")
    .select("id, nome, area_construida_m2, fase")
    .eq("alvara_numero", ALVARA_EM_FOCO)
    .single();
  if (obraErr) throw obraErr;

  const { data: inventarios, error: invErr } = await db
    .from("inventarios")
    .select("id, versao, status, created_at, lancamentos(natureza, tco2e)")
    .eq("obra_id", obra.id)
    .order("versao", { ascending: true });
  if (invErr) throw invErr;

  const versoes = (inventarios ?? []).map((inv) => {
    const passivo = inv.lancamentos.filter((l) => l.natureza === "passivo").reduce((s, l) => s + Number(l.tco2e), 0);
    const ativo = inv.lancamentos.filter((l) => l.natureza === "ativo").reduce((s, l) => s + Number(l.tco2e), 0);
    const intensidade = Math.round(((passivo - ativo) * 1000) / obra.area_construida_m2);
    return {
      versao: inv.versao,
      status: inv.status,
      label: new Date(inv.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      passivo,
      ativo,
      intensidade,
    };
  });

  const atual = versoes.at(-1);

  return {
    obra: {
      nome: obra.nome,
      areaM2: obra.area_construida_m2,
      fase: obra.fase,
      faixaAlvo: "≤ 200 kgCO₂e/m² (faixa AA)",
    },
    balanco: { passivo: atual?.passivo ?? 0, ativo: atual?.ativo ?? 0 },
    statusInventarioAtual: atual?.status ?? "rascunho",
    projecaoFechamento: versoes.map((v) => ({ fase: v.label, intensidade: v.intensidade })),
  };
}

export interface Alternativa {
  id: string;
  material: string;
  original: string;
  unidade: string;
  custoAdicionalPorUnidade: number;
  tco2eEvitadoPorUnidade: number;
}

export async function getAlternativasMaterial(): Promise<Alternativa[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("alternativas_material")
    .select("id, material, material_original, unidade, custo_adicional_por_unidade, tco2e_evitado_por_unidade")
    .eq("ativo", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((a) => ({
    id: a.id,
    material: a.material,
    original: a.material_original,
    unidade: a.unidade,
    custoAdicionalPorUnidade: Number(a.custo_adicional_por_unidade),
    tco2eEvitadoPorUnidade: Number(a.tco2e_evitado_por_unidade),
  }));
}
