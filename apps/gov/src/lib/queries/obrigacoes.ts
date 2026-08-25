import { createServerSupabase } from "@carbonfree/database/server";
import type { AlvaraSisobra } from "../sisobrapref";
import { competenciaDeReferencia, diasAteOPrazo, pendenciasDoAlvara, prazoDaCompetencia } from "../sisobrapref";

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
  /** Dias até o prazo legal (dia 10). Calculado aqui porque ler o relógio
   *  é impuro e não pertence ao corpo do componente. */
  diasRestantes: number;
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
    diasRestantes: diasAteOPrazo(prazoDaCompetencia(ref), new Date()),
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
