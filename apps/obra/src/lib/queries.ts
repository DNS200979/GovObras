import { createAdminClient } from "@carbonfree/database/admin";
import { DOCUMENTOS_ESPERADOS } from "./documentos";
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

// ============================================================
// Obras — cadastro pela própria construtora
// ============================================================

export interface ObraListItem {
  id: string;
  nome: string;
  alvaraNumero: string;
  tipologia: string;
  areaM2: number;
  fase: string;
  municipio: string;
  totalDocumentos: number;
  documentosFaltando: string[];
}

interface ObraListRow {
  id: string;
  nome: string;
  alvara_numero: string;
  tipologia: string;
  area_construida_m2: number;
  fase: string;
  municipios: { nome: string; uf: string } | null;
  obra_documentos: { tipo: string }[];
}

export async function listObras(): Promise<ObraListItem[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obras")
    .select(
      "id, nome, alvara_numero, tipologia, area_construida_m2, fase, municipios(nome, uf), obra_documentos(tipo)",
    )
    .order("created_at", { ascending: true })
    .returns<ObraListRow[]>();
  if (error) throw error;

  return (data ?? []).map((o) => {
    const tipos = new Set((o.obra_documentos ?? []).map((d) => d.tipo));
    return {
      id: o.id,
      nome: o.nome,
      alvaraNumero: o.alvara_numero,
      tipologia: o.tipologia,
      areaM2: o.area_construida_m2,
      fase: o.fase,
      municipio: o.municipios ? `${o.municipios.nome}/${o.municipios.uf}` : "—",
      totalDocumentos: (o.obra_documentos ?? []).length,
      documentosFaltando: DOCUMENTOS_ESPERADOS.filter((t) => !tipos.has(t)),
    };
  });
}

export interface ObraDocumento {
  id: string;
  tipo: string;
  descricao: string | null;
  nomeArquivo: string;
  storagePath: string;
  tamanhoBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ObraDetalhe {
  id: string;
  nome: string;
  alvaraNumero: string;
  tipologia: string;
  areaM2: number;
  fase: string;
  inscricaoImobiliaria: string | null;
  cno: string | null;
  latitude: number | null;
  longitude: number | null;
  municipio: string;
  documentos: ObraDocumento[];
  documentosFaltando: string[];
}

interface ObraDetalheRow {
  id: string;
  nome: string;
  alvara_numero: string;
  tipologia: string;
  area_construida_m2: number;
  fase: string;
  inscricao_imobiliaria: string | null;
  cno: string | null;
  latitude: number | null;
  longitude: number | null;
  municipios: { nome: string; uf: string } | null;
  obra_documentos: {
    id: string;
    tipo: string;
    descricao: string | null;
    nome_arquivo: string;
    storage_path: string;
    tamanho_bytes: number | null;
    created_at: string;
  }[];
}

export async function getObra(id: string): Promise<ObraDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obras")
    .select(
      "id, nome, alvara_numero, tipologia, area_construida_m2, fase, inscricao_imobiliaria, cno, latitude, longitude, municipios(nome, uf), obra_documentos(id, tipo, descricao, nome_arquivo, storage_path, tamanho_bytes, created_at)",
    )
    .eq("id", id)
    .single<ObraDetalheRow>();
  if (error) return null;

  const documentos = await Promise.all(
    (data.obra_documentos ?? []).map(async (doc) => {
      const { data: signed } = await db.storage
        .from("obra-docs")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return {
        id: doc.id,
        tipo: doc.tipo,
        descricao: doc.descricao,
        nomeArquivo: doc.nome_arquivo,
        storagePath: doc.storage_path,
        tamanhoBytes: doc.tamanho_bytes,
        createdAt: doc.created_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );

  const tipos = new Set(documentos.map((d) => d.tipo));

  return {
    id: data.id,
    nome: data.nome,
    alvaraNumero: data.alvara_numero,
    tipologia: data.tipologia,
    areaM2: data.area_construida_m2,
    fase: data.fase,
    inscricaoImobiliaria: data.inscricao_imobiliaria,
    cno: data.cno,
    latitude: data.latitude,
    longitude: data.longitude,
    municipio: data.municipios ? `${data.municipios.nome}/${data.municipios.uf}` : "—",
    documentos,
    documentosFaltando: DOCUMENTOS_ESPERADOS.filter((t) => !tipos.has(t)),
  };
}

export async function listMunicipios() {
  const db = await createServerSupabase();
  const { data, error } = await db.from("municipios").select("id, nome, uf").order("nome");
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Dossiê — trâmite, evolução do inventário e faixa do selo
// ============================================================

export interface FaixaRegua {
  faixa: string;
  ate_kgco2e_m2: number;
  beneficio: string;
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

  const regua = ((municipio?.faixa_regua ?? []) as FaixaRegua[])
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
    natureza: r.natureza,
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
