/**
 * Peças usadas por mais de um módulo de consulta: a régua de faixa/risco e a
 * leitura de obras com o inventário mais recente, que alimenta painel, lista
 * de obras e mapa.
 */

import { createServerSupabase } from "@carbonfree/database/server";

/**
 * Leituras com o cliente de sessão real — RLS aplica o escopo do
 * município do usuário logado (ver proxy.ts e a policy "obras: prefeitura
 * vê as do município"). Sem sessão, a página nem chega aqui (proxy.ts
 * redireciona para /login antes).
 */

export const TIERS = ["AAA", "AA", "A", "B", "C"] as const;

export function faixaPorIntensidade(kgM2: number): (typeof TIERS)[number] {
  if (kgM2 <= 150) return "AAA";
  if (kgM2 <= 200) return "AA";
  if (kgM2 <= 280) return "A";
  if (kgM2 <= 380) return "B";
  return "C";
}

export function riscoPorIntensidade(kgM2: number): "baixo" | "medio" | "alto" {
  if (kgM2 > 380) return "alto";
  if (kgM2 > 250) return "medio";
  return "baixo";
}

export function relativo(iso: string) {
  const dias = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "1 dia atrás";
  return `${dias} dias atrás`;
}

export async function obrasComInventarioAtual() {
  const db = await createServerSupabase();

  const { data: obras, error: obrasErr } = await db
    .from("obras")
    .select(
      "id, nome, alvara_numero, tipologia, area_construida_m2, fase, latitude, longitude, cno, inscricao_imobiliaria, construtora_id, data_alvara, data_inicio_obra, data_final_obra, tipo_alvara, responsavel_exec_obra, cep, tipo_logradouro, logradouro, numero_imovel, complemento, bairro, area_categoria, area_destinacao, area_tipo_obra, resp_tecnico_tipo, resp_tecnico_nome, resp_tecnico_registro, resp_tecnico_documento, construtoras(razao_social)",
    );
  if (obrasErr) throw obrasErr;

  const { data: inventarios, error: invErr } = await db
    .from("inventarios")
    .select("id, obra_id, versao, status, created_at, homologado_em, lancamentos(natureza, tco2e, created_at)")
    .order("versao", { ascending: false });
  if (invErr) throw invErr;

  // pega a versão mais recente de cada obra
  const atualPorObra = new Map<string, (typeof inventarios)[number]>();
  for (const inv of inventarios ?? []) {
    if (!atualPorObra.has(inv.obra_id)) atualPorObra.set(inv.obra_id, inv);
  }

  return (obras ?? []).map((obra) => {
    const inv = atualPorObra.get(obra.id);
    const passivo = inv?.lancamentos?.filter((l) => l.natureza === "passivo").reduce((s, l) => s + Number(l.tco2e), 0) ?? 0;
    const ativo = inv?.lancamentos?.filter((l) => l.natureza === "ativo").reduce((s, l) => s + Number(l.tco2e), 0) ?? 0;
    const netT = passivo - ativo;
    const intensidade = obra.area_construida_m2 > 0 ? Math.round((netT * 1000) / obra.area_construida_m2) : 0;
    return {
      obraId: obra.id,
      nome: obra.nome,
      alvara: obra.alvara_numero,
      construtoraId: obra.construtora_id as string,
      construtora: (obra.construtoras as unknown as { razao_social: string } | null)?.razao_social ?? "—",
      tipologia: obra.tipologia,
      areaM2: obra.area_construida_m2,
      fase: obra.fase,
      latitude: obra.latitude as number | null,
      longitude: obra.longitude as number | null,
      cno: obra.cno as string | null,
      inscricaoImobiliaria: obra.inscricao_imobiliaria as string | null,
      dataAlvara: obra.data_alvara as string | null,
      dataInicioObra: obra.data_inicio_obra as string | null,
      dataFinalObra: obra.data_final_obra as string | null,
      tipoAlvara: obra.tipo_alvara as string | null,
      responsavelExecObra: obra.responsavel_exec_obra as string | null,
      cep: obra.cep as string | null,
      tipoLogradouro: obra.tipo_logradouro as string | null,
      logradouro: obra.logradouro as string | null,
      numeroImovel: obra.numero_imovel as string | null,
      complemento: obra.complemento as string | null,
      bairro: obra.bairro as string | null,
      areaCategoria: obra.area_categoria as string | null,
      areaDestinacao: obra.area_destinacao as string | null,
      areaTipoObra: obra.area_tipo_obra as string | null,
      respTecnicoTipo: obra.resp_tecnico_tipo as string | null,
      respTecnicoNome: obra.resp_tecnico_nome as string | null,
      respTecnicoRegistro: obra.resp_tecnico_registro as string | null,
      respTecnicoDocumento: obra.resp_tecnico_documento as string | null,
      passivo,
      ativo,
      intensidade,
      status: inv?.status ?? "rascunho",
      atualizadoEm: inv?.created_at ?? null,
    };
  });
}
