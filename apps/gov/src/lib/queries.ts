import { createServerSupabase } from "@carbonfree/database/server";

/**
 * Leituras com o cliente de sessão real — RLS aplica o escopo do
 * município do usuário logado (ver proxy.ts e a policy "obras: prefeitura
 * vê as do município"). Sem sessão, a página nem chega aqui (proxy.ts
 * redireciona para /login antes).
 */

const TIERS = ["AAA", "AA", "A", "B", "C"] as const;

function faixaPorIntensidade(kgM2: number): (typeof TIERS)[number] {
  if (kgM2 <= 150) return "AAA";
  if (kgM2 <= 200) return "AA";
  if (kgM2 <= 280) return "A";
  if (kgM2 <= 380) return "B";
  return "C";
}

function riscoPorIntensidade(kgM2: number): "baixo" | "medio" | "alto" {
  if (kgM2 > 380) return "alto";
  if (kgM2 > 250) return "medio";
  return "baixo";
}

function relativo(iso: string) {
  const dias = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "1 dia atrás";
  return `${dias} dias atrás`;
}

async function obrasComInventarioAtual() {
  const db = await createServerSupabase();

  const { data: obras, error: obrasErr } = await db
    .from("obras")
    .select("id, nome, alvara_numero, tipologia, area_construida_m2, fase, construtoras(razao_social)");
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
      construtora: (obra.construtoras as unknown as { razao_social: string } | null)?.razao_social ?? "—",
      tipologia: obra.tipologia,
      areaM2: obra.area_construida_m2,
      fase: obra.fase,
      passivo,
      ativo,
      intensidade,
      status: inv?.status ?? "rascunho",
      atualizadoEm: inv?.created_at ?? null,
    };
  });
}

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

export async function getObrasList() {
  return obrasComInventarioAtual();
}

export interface Fiscalizacao {
  id: string;
  obraId: string;
  obra: string;
  construtora: string;
  fiscal: string;
  agendadoPara: string | null;
  status: string;
}

export async function getFiscalizacoes(): Promise<Fiscalizacao[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("fiscalizacoes")
    .select("id, obra_id, agendado_para, status, obras(nome, construtoras(razao_social)), perfis(nome)")
    .order("agendado_para", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((f) => {
    const obra = f.obras as unknown as { nome: string; construtoras: { razao_social: string } } | null;
    const fiscal = f.perfis as unknown as { nome: string } | null;
    return {
      id: f.id,
      obraId: f.obra_id,
      obra: obra?.nome ?? "—",
      construtora: obra?.construtoras?.razao_social ?? "—",
      fiscal: fiscal?.nome ?? "—",
      agendadoPara: f.agendado_para,
      status: f.status,
    };
  });
}

export async function getFiscais() {
  const db = await createServerSupabase();
  const { data, error } = await db.from("perfis").select("id, nome").eq("papel", "fiscal").order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function getObrasParaSelect() {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obras")
    .select("id, nome, alvara_numero")
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function getConstrutoras() {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("construtoras")
    .select("id, razao_social, cnpj_cpf")
    .order("razao_social");
  if (error) throw error;
  return data ?? [];
}

export interface ConstrutoraComContagem {
  id: string;
  razaoSocial: string;
  cnpjCpf: string;
  tipo: string;
  totalObras: number;
}

export async function getConstrutorasComContagem(): Promise<ConstrutoraComContagem[]> {
  const db = await createServerSupabase();
  const { data: construtoras, error } = await db
    .from("construtoras")
    .select("id, razao_social, cnpj_cpf, tipo")
    .order("razao_social");
  if (error) throw error;

  const { data: obras } = await db.from("obras").select("construtora_id");
  const contagem = new Map<string, number>();
  for (const o of obras ?? []) {
    contagem.set(o.construtora_id, (contagem.get(o.construtora_id) ?? 0) + 1);
  }

  return (construtoras ?? []).map((c) => ({
    id: c.id,
    razaoSocial: c.razao_social,
    cnpjCpf: c.cnpj_cpf,
    tipo: c.tipo,
    totalObras: contagem.get(c.id) ?? 0,
  }));
}

export interface RequisitoAuditoria {
  id: string;
  natureza: "passivo" | "ativo";
  codigo: string;
  requisito: string;
  unidade: string;
  evidenciaPrimaria: string;
  testeVerificacao: string;
}

export async function getRequisitosAuditoria(): Promise<RequisitoAuditoria[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("requisitos_auditoria")
    .select("id, natureza, codigo, requisito, unidade, evidencia_primaria, teste_verificacao")
    .order("natureza")
    .order("ordem");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    natureza: r.natureza,
    codigo: r.codigo,
    requisito: r.requisito,
    unidade: r.unidade,
    evidenciaPrimaria: r.evidencia_primaria,
    testeVerificacao: r.teste_verificacao,
  }));
}
