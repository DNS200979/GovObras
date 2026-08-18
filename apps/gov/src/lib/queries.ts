import { createServerSupabase } from "@carbonfree/database/server";
import type { AlvaraSisobra } from "./sisobrapref";
import { competenciaDeReferencia, pendenciasDoAlvara } from "./sisobrapref";
import type { Resposta, SituacaoDoc } from "./financiamento";
import { calcularDiagnostico } from "./financiamento";

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

// ============================================================
// ESG — projetos enviados pelas construtoras
// ============================================================

export const categoriaEsgLabel: Record<string, string> = {
  ambiental: "Ambiental",
  social: "Social",
  governanca: "Governança",
};

export const statusEsgLabel: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export interface ProjetoEsgResumo {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  obra: string;
  construtora: string;
  enviadoEm: string | null;
  createdAt: string;
  requisitoCodigo: string | null;
}

interface ProjetoEsgListRow {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  enviado_em: string | null;
  created_at: string;
  obras: { nome: string; construtoras: { razao_social: string } | null } | null;
  requisitos_auditoria: { codigo: string } | null;
}

export async function listProjetosEsg(): Promise<ProjetoEsgResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_esg")
    .select(
      "id, titulo, categoria, status, enviado_em, created_at, obras(nome, construtoras(razao_social)), requisitos_auditoria(codigo)",
    )
    .neq("status", "rascunho")
    .order("enviado_em", { ascending: false, nullsFirst: false })
    .returns<ProjetoEsgListRow[]>();
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    categoria: p.categoria,
    status: p.status,
    obra: p.obras?.nome ?? "—",
    construtora: p.obras?.construtoras?.razao_social ?? "—",
    enviadoEm: p.enviado_em,
    createdAt: p.created_at,
    requisitoCodigo: p.requisitos_auditoria?.codigo ?? null,
  }));
}

export interface ProjetoEsgDocumentoGov {
  id: string;
  nomeArquivo: string;
  tamanhoBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ProjetoEsgDetalheGov {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  obra: string;
  alvaraNumero: string;
  construtora: string;
  enviadoEm: string | null;
  decidoEm: string | null;
  motivoDecisao: string | null;
  requisito: { codigo: string; requisito: string; natureza: string } | null;
  documentos: ProjetoEsgDocumentoGov[];
}

interface ProjetoEsgDetalheRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  enviado_em: string | null;
  decidido_em: string | null;
  motivo_decisao: string | null;
  obras: { nome: string; alvara_numero: string; construtoras: { razao_social: string } | null } | null;
  requisitos_auditoria: { codigo: string; requisito: string; natureza: string } | null;
  projeto_esg_documentos: {
    id: string;
    nome_arquivo: string;
    storage_path: string;
    tamanho_bytes: number | null;
    created_at: string;
  }[];
}

export async function getProjetoEsgGov(id: string): Promise<ProjetoEsgDetalheGov | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_esg")
    .select(
      "id, titulo, descricao, categoria, status, enviado_em, decidido_em, motivo_decisao, obras(nome, alvara_numero, construtoras(razao_social)), requisitos_auditoria(codigo, requisito, natureza), projeto_esg_documentos(id, nome_arquivo, storage_path, tamanho_bytes, created_at)",
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
    obra: data.obras?.nome ?? "—",
    alvaraNumero: data.obras?.alvara_numero ?? "—",
    construtora: data.obras?.construtoras?.razao_social ?? "—",
    enviadoEm: data.enviado_em,
    decidoEm: data.decidido_em,
    motivoDecisao: data.motivo_decisao,
    requisito: data.requisitos_auditoria,
    documentos,
  };
}

// ============================================================
// SisobraPref — obrigação mensal junto à Receita Federal
// ============================================================


export interface AlvaraDaCompetencia extends AlvaraSisobra {
  id: string;
  pendencias: string[];
}

export interface CompetenciaSisobra {
  competencia: string;
  cnpjMunicipio: string | null;
  municipio: string;
  alvaras: AlvaraDaCompetencia[];
  prontos: number;
  comPendencia: number;
  envio: {
    id: string;
    tipo: string;
    status: string;
    protocolo: string | null;
    transmitidoEm: string | null;
    mensagemErro: string | null;
  } | null;
}

interface ObraSisobraRow {
  id: string;
  nome: string;
  alvara_numero: string;
  area_construida_m2: number;
  data_alvara: string | null;
  data_inicio_obra: string | null;
  data_final_obra: string | null;
  tipo_alvara: string | null;
  responsavel_exec_obra: string | null;
  cep: string | null;
  tipo_logradouro: string | null;
  logradouro: string | null;
  numero_imovel: string | null;
  complemento: string | null;
  bairro: string | null;
  area_categoria: string | null;
  area_destinacao: string | null;
  area_tipo_obra: string | null;
  resp_tecnico_tipo: string | null;
  resp_tecnico_nome: string | null;
  resp_tecnico_registro: string | null;
  resp_tecnico_documento: string | null;
  construtoras: { cnpj_cpf: string } | null;
}

/**
 * Alvarás de uma competência (mês de emissão) com o que falta em cada um.
 * Obras sem `data_alvara` não entram: sem essa data não há como saber a que
 * mês elas pertencem — aparecem como pendência no cadastro, não aqui.
 */
export async function getCompetenciaSisobra(competencia?: Date): Promise<CompetenciaSisobra> {
  const db = await createServerSupabase();
  const ref = competencia ?? competenciaDeReferencia();

  const inicio = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
  const fim = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { data: municipio } = await db.from("municipios").select("id, nome, cnpj").single();

  const { data, error } = await db
    .from("obras")
    .select(
      "id, nome, alvara_numero, area_construida_m2, data_alvara, data_inicio_obra, data_final_obra, tipo_alvara, responsavel_exec_obra, cep, tipo_logradouro, logradouro, numero_imovel, complemento, bairro, area_categoria, area_destinacao, area_tipo_obra, resp_tecnico_tipo, resp_tecnico_nome, resp_tecnico_registro, resp_tecnico_documento, construtoras(cnpj_cpf)",
    )
    .gte("data_alvara", iso(inicio))
    .lt("data_alvara", iso(fim))
    .order("data_alvara")
    .returns<ObraSisobraRow[]>();
  if (error) throw error;

  const alvaras: AlvaraDaCompetencia[] = (data ?? []).map((o) => {
    const base: AlvaraSisobra = {
      numeroAlvara: o.alvara_numero,
      nomeObra: o.nome,
      dataAlvara: o.data_alvara,
      dataInicioObra: o.data_inicio_obra,
      dataFinalObra: o.data_final_obra,
      tipoAlvara: o.tipo_alvara,
      responsavelExecObra: o.responsavel_exec_obra,
      cnpjCpfResponsavel: o.construtoras?.cnpj_cpf ?? null,
      cep: o.cep,
      tipoLogradouro: o.tipo_logradouro,
      logradouro: o.logradouro,
      numeroImovel: o.numero_imovel,
      complemento: o.complemento,
      bairro: o.bairro,
      areaCategoria: o.area_categoria,
      areaDestinacao: o.area_destinacao,
      areaTipoObra: o.area_tipo_obra,
      areaM2: Number(o.area_construida_m2),
      respTecnicoTipo: o.resp_tecnico_tipo,
      respTecnicoNome: o.resp_tecnico_nome,
      respTecnicoRegistro: o.resp_tecnico_registro,
      respTecnicoDocumento: o.resp_tecnico_documento,
    };
    return { ...base, id: o.id, pendencias: pendenciasDoAlvara(base) };
  });

  const { data: envio } = await db
    .from("sisobra_envios")
    .select("id, tipo, status, protocolo, transmitido_em, mensagem_erro")
    .eq("competencia", iso(ref))
    .maybeSingle();

  return {
    competencia: iso(ref),
    cnpjMunicipio: municipio?.cnpj ?? null,
    municipio: municipio?.nome ?? "—",
    alvaras,
    prontos: alvaras.filter((a) => a.pendencias.length === 0).length,
    comPendencia: alvaras.filter((a) => a.pendencias.length > 0).length,
    envio: envio
      ? {
          id: envio.id,
          tipo: envio.tipo,
          status: envio.status,
          protocolo: envio.protocolo,
          transmitidoEm: envio.transmitido_em,
          mensagemErro: envio.mensagem_erro,
        }
      : null,
  };
}

/** Últimas competências com envio já registrado, para o histórico. */
export async function listEnviosSisobra() {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("sisobra_envios")
    .select("id, competencia, tipo, status, protocolo, total_alvaras, transmitido_em")
    .order("competencia", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Financiamento climático — projetos de captação e diagnóstico
// ============================================================

export interface ProjetoCaptacaoResumo {
  id: string;
  nome: string;
  tema: string;
  situacao: string;
  valorEstimadoBrl: number | null;
  prontidaoPct: number;
  classificacao: string;
  respondidas: number;
  createdAt: string;
}

export async function listProjetosCaptacao(): Promise<ProjetoCaptacaoResumo[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_captacao")
    .select("id, nome, tema, situacao, valor_estimado_brl, created_at, diagnostico_respostas(questao_id, resposta)")
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        nome: string;
        tema: string;
        situacao: string;
        valor_estimado_brl: number | null;
        created_at: string;
        diagnostico_respostas: { questao_id: number; resposta: Resposta }[];
      }[]
    >();
  if (error) throw error;

  return (data ?? []).map((p) => {
    const mapa = new Map<number, Resposta>(
      (p.diagnostico_respostas ?? []).map((r) => [r.questao_id, r.resposta]),
    );
    const d = calcularDiagnostico(mapa);
    return {
      id: p.id,
      nome: p.nome,
      tema: p.tema,
      situacao: p.situacao,
      valorEstimadoBrl: p.valor_estimado_brl,
      prontidaoPct: d.prontidaoPct,
      classificacao: d.classificacao,
      respondidas: d.respondidas,
      createdAt: p.created_at,
    };
  });
}

export interface RespostaSalva {
  questaoId: number;
  resposta: Resposta;
  evidencia: string | null;
  origem: string;
}

export interface ProjetoCaptacaoDetalhe {
  id: string;
  nome: string;
  descricao: string;
  tema: string;
  situacao: string;
  valorEstimadoBrl: number | null;
  respostas: RespostaSalva[];
  diagnostico: ReturnType<typeof calcularDiagnostico>;
}

export async function getProjetoCaptacao(id: string): Promise<ProjetoCaptacaoDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projetos_captacao")
    .select("id, nome, descricao, tema, situacao, valor_estimado_brl, diagnostico_respostas(questao_id, resposta, evidencia, origem)")
    .eq("id", id)
    .single<{
      id: string;
      nome: string;
      descricao: string;
      tema: string;
      situacao: string;
      valor_estimado_brl: number | null;
      diagnostico_respostas: {
        questao_id: number;
        resposta: Resposta;
        evidencia: string | null;
        origem: string;
      }[];
    }>();
  if (error) return null;

  const respostas: RespostaSalva[] = (data.diagnostico_respostas ?? []).map((r) => ({
    questaoId: r.questao_id,
    resposta: r.resposta,
    evidencia: r.evidencia,
    origem: r.origem,
  }));

  const mapa = new Map<number, Resposta>(respostas.map((r) => [r.questaoId, r.resposta]));

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    tema: data.tema,
    situacao: data.situacao,
    valorEstimadoBrl: data.valor_estimado_brl,
    respostas,
    diagnostico: calcularDiagnostico(mapa),
  };
}

export interface DocumentoProjeto {
  documentoId: number;
  situacao: SituacaoDoc;
  observacao: string | null;
  nomeArquivo: string | null;
  storagePath: string | null;
  updatedAt: string;
}

export async function listDocumentosProjeto(projetoId: string): Promise<DocumentoProjeto[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("projeto_documentos")
    .select("documento_id, situacao, observacao, nome_arquivo, storage_path, updated_at")
    .eq("projeto_id", projetoId);
  if (error) throw error;

  return (data ?? []).map((d) => ({
    documentoId: d.documento_id,
    situacao: d.situacao as SituacaoDoc,
    observacao: d.observacao,
    nomeArquivo: d.nome_arquivo,
    storagePath: d.storage_path,
    updatedAt: d.updated_at,
  }));
}

/** URL temporária para baixar o anexo; o bucket é privado. */
export async function urlDoAnexo(storagePath: string): Promise<string | null> {
  const db = await createServerSupabase();
  const { data } = await db.storage.from("captacao-docs").createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}

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
