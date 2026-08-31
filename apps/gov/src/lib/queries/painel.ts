/** Consultas do painel inicial da prefeitura. */
import { createServerSupabase } from "@carbonfree/database/server";
import { faixaPorIntensidade, riscoPorIntensidade, relativo, obrasComInventarioAtual, TIERS } from "./_compartilhado";

export async function getPainelData() {
  const db = await createServerSupabase();
  const obras = await obrasComInventarioAtual();

  const { count: selosEmitidos } = await db.from("selos").select("*", { count: "exact", head: true });

  const dossiesPendentes = obras.filter((o) => o.status === "em_analise" || o.status === "protocolado").length;
  const intensidades = obras.filter((o) => o.intensidade > 0).map((o) => o.intensidade);
  const intensidadeMedia = intensidades.length
    ? Math.round(intensidades.reduce((a, b) => a + b, 0) / intensidades.length)
    : 0;

  const balancoMunicipal = obras.reduce(
    (acc, o) => ({ passivo: acc.passivo + o.passivo, ativo: acc.ativo + o.ativo }),
    { passivo: 0, ativo: 0 },
  );

  const contagemFaixas = Object.fromEntries(TIERS.map((t) => [t, 0])) as Record<(typeof TIERS)[number], number>;
  for (const o of obras) if (o.intensidade > 0) contagemFaixas[faixaPorIntensidade(o.intensidade)]++;
  const distribuicaoFaixas = TIERS.map((faixa) => ({
    faixa,
    obras: contagemFaixas[faixa],
    tone: (faixa === "AAA" || faixa === "AA" ? "ativo" : faixa === "C" ? "passivo" : "neutro") as
      | "ativo"
      | "passivo"
      | "neutro",
  }));

  // série mensal real a partir das datas de criação dos lançamentos existentes
  const { data: lancamentos } = await db
    .from("lancamentos")
    .select("natureza, tco2e, created_at, inventarios(obra_id, obras(area_construida_m2))");
  const porMes = new Map<string, { label: string; passivo: number; ativo: number; areas: Set<string> }>();
  for (const l of lancamentos ?? []) {
    const data = new Date(l.created_at);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    const label = data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const areaObj = l.inventarios as unknown as { obra_id: string; obras: { area_construida_m2: number } } | null;
    if (!porMes.has(chave)) porMes.set(chave, { label, passivo: 0, ativo: 0, areas: new Set() });
    const bucket = porMes.get(chave)!;
    if (l.natureza === "passivo") bucket.passivo += Number(l.tco2e);
    else bucket.ativo += Number(l.tco2e);
    if (areaObj) bucket.areas.add(`${areaObj.obra_id}:${areaObj.obras.area_construida_m2}`);
  }
  const serieIntensidade = [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => {
      const areaTotal = [...v.areas].reduce((s, key) => s + Number(key.split(":")[1]), 0) || 1;
      return { mes: v.label, intensidade: Math.round(((v.passivo - v.ativo) * 1000) / areaTotal) };
    });

  const mesaAnalise = obras
    .filter((o) => o.status !== "homologado" && o.status !== "rejeitado")
    .sort((a, b) => b.intensidade - a.intensidade)
    .map((o) => ({
      id: o.obraId,
      obra: o.nome,
      alvara: o.alvara,
      construtora: o.construtora,
      intensidade: o.intensidade,
      risco: riscoPorIntensidade(o.intensidade),
      atualizado: o.atualizadoEm ? relativo(o.atualizadoEm) : "—",
      status: o.status,
    }));

  return {
    kpis: {
      obrasAtivas: obras.length,
      dossiesPendentes,
      selosEmitidos: selosEmitidos ?? 0,
      intensidadeMediaKgM2: intensidadeMedia,
    },
    balancoMunicipal,
    distribuicaoFaixas,
    serieIntensidade,
    mesaAnalise,
  };
}
