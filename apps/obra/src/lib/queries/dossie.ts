import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// Dossiê — trâmite, evolução do inventário e faixa do selo
// ============================================================

export interface FaixaRegua {
  faixa: string;
  ate_kgco2e_m2: number;
  beneficio: string;
}

/** Mantém só as entradas bem formadas do jsonb `municipios.faixa_regua`. */
function ehFaixaRegua(valor: unknown): FaixaRegua[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter(
    (f): f is FaixaRegua =>
      !!f &&
      typeof f === "object" &&
      typeof (f as FaixaRegua).faixa === "string" &&
      typeof (f as FaixaRegua).ate_kgco2e_m2 === "number" &&
      typeof (f as FaixaRegua).beneficio === "string",
  );
}

export interface VersaoInventario {
  versao: number;
  status: string;
  label: string;
  passivo: number;
  ativo: number;
  intensidade: number;
}

export interface ComposicaoItem {
  modulo: string;
  item: string;
  tco2e: number;
}

export interface DossieData {
  obra: { nome: string; alvara: string; areaM2: number; fase: string };
  versoes: VersaoInventario[];
  atual: VersaoInventario | null;
  composicaoPassivo: ComposicaoItem[];
  composicaoAtivo: ComposicaoItem[];
  regua: FaixaRegua[];
  tetoCompensacaoPct: number;
}

/** Faixa em que a intensidade cai, dada a régua do município (ordenada por limite). */
export function faixaDe(intensidade: number, regua: FaixaRegua[]): FaixaRegua | null {
  return regua.find((f) => intensidade <= f.ate_kgco2e_m2) ?? null;
}

export async function getDossie(): Promise<DossieData> {
  const db = await createServerSupabase();

  const { data: obra, error: obraErr } = await db
    .from("obras")
    .select("id, nome, alvara_numero, area_construida_m2, fase, municipio_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (obraErr) throw obraErr;

  const [{ data: inventarios }, { data: municipio }] = await Promise.all([
    db
      .from("inventarios")
      .select("id, versao, status, created_at, lancamentos(natureza, tco2e, modulo_en15978, item)")
      .eq("obra_id", obra.id)
      .order("versao", { ascending: true }),
    db
      .from("municipios")
      .select("faixa_regua, teto_compensacao_pct")
      .eq("id", obra.municipio_id)
      .single(),
  ]);

  type LancamentoRow = { natureza: string; tco2e: number; modulo_en15978: string; item: string };
  type InventarioRow = {
    id: string;
    versao: number;
    status: string;
    created_at: string;
    lancamentos: LancamentoRow[];
  };

  const linhas = (inventarios ?? []) as InventarioRow[];

  const versoes: VersaoInventario[] = linhas.map((inv) => {
    const passivo = inv.lancamentos
      .filter((l) => l.natureza === "passivo")
      .reduce((s, l) => s + Number(l.tco2e), 0);
    const ativo = inv.lancamentos
      .filter((l) => l.natureza === "ativo")
      .reduce((s, l) => s + Number(l.tco2e), 0);
    return {
      versao: inv.versao,
      status: inv.status,
      label: `v${inv.versao}`,
      passivo,
      ativo,
      intensidade: Math.round(((passivo - ativo) * 1000) / obra.area_construida_m2),
    };
  });

  const ultimo = linhas.at(-1);
  const agrupar = (natureza: string): ComposicaoItem[] =>
    (ultimo?.lancamentos ?? [])
      .filter((l) => l.natureza === natureza)
      .map((l) => ({ modulo: l.modulo_en15978, item: l.item, tco2e: Number(l.tco2e) }))
      .sort((a, b) => b.tco2e - a.tco2e);

  // `faixa_regua` é jsonb sem constraint de forma no banco — diferente de
  // `natureza`, aqui não há nada garantindo o formato. Um item malformado
  // faria o sort comparar NaN e embaralhar a régua em silêncio, então filtra.
  const regua = ehFaixaRegua(municipio?.faixa_regua)
    .slice()
    .sort((a, b) => a.ate_kgco2e_m2 - b.ate_kgco2e_m2);

  return {
    obra: {
      nome: obra.nome,
      alvara: obra.alvara_numero,
      areaM2: obra.area_construida_m2,
      fase: obra.fase,
    },
    versoes,
    atual: versoes.at(-1) ?? null,
    composicaoPassivo: agrupar("passivo"),
    composicaoAtivo: agrupar("ativo"),
    regua,
    tetoCompensacaoPct: Number(municipio?.teto_compensacao_pct ?? 30),
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
  // Catálogo global: a policy "alternativas_material: leitura autenticada"
  // (migration 3, endurecida na 5) já libera para qualquer autenticado —
  // não precisa de service role.
  const db = await createServerSupabase();
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
