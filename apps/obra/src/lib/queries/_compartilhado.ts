import { createServerSupabase } from "@carbonfree/database/server";

/**
 * `getObraAtual` e as consultas de ESG usam o cliente da sessão — RLS
 * escopa tudo por `construtora_id` do perfil logado (ver
 * `perfis: obras: construtora vê as próprias` na migration 002). Uma
 * construtora pode ter mais de uma obra; por ora o painel principal
 * mostra a mais antiga como "obra em foco" — trocar por um seletor
 * quando isso virar um problema real.
 */

export async function getObraAtual() {
  const db = await createServerSupabase();

  const { data: obra, error: obraErr } = await db
    .from("obras")
    .select("id, nome, area_construida_m2, fase")
    .order("created_at", { ascending: true })
    .limit(1)
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
    temInventario: versoes.length > 0,
    projecaoFechamento: versoes.map((v) => ({ fase: v.label, intensidade: v.intensidade })),
  };
}
