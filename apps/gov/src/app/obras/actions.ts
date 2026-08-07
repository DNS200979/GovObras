"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";

export interface CriarObraState {
  error?: string;
  ok?: boolean;
}

interface CamposObra {
  alvara_numero: string;
  nome: string;
  tipologia: string;
  area_construida_m2: number;
  fase: string;
  cno: string | null;
  inscricao_imobiliaria: string | null;
  coordenadas: string | null;
  // campos exigidos pelo SisobraPref (Receita Federal)
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
}

/** Texto do formulário → null quando vazio, que é o que o banco espera. */
function opcional(formData: FormData, campo: string): string | null {
  return formData.get(campo)?.toString().trim() || null;
}

function parseCamposObra(formData: FormData): { campos: CamposObra } | { error: string } {
  const alvaraNumero = formData.get("alvaraNumero")?.toString().trim();
  const nome = formData.get("nome")?.toString().trim();
  const tipologia = formData.get("tipologia")?.toString();
  const areaM2 = Number(formData.get("areaM2"));
  const fase = formData.get("fase")?.toString() || "fundacao";
  const cno = formData.get("cno")?.toString().trim() || null;
  const inscricaoImobiliaria = formData.get("inscricaoImobiliaria")?.toString().trim() || null;
  const latitudeRaw = formData.get("latitude")?.toString().trim();
  const longitudeRaw = formData.get("longitude")?.toString().trim();

  if (!alvaraNumero || !nome || !tipologia || !areaM2 || areaM2 <= 0) {
    return { error: "Preencha alvará, nome, tipologia e área (m²)." };
  }

  let coordenadas: string | null = null;
  if (latitudeRaw || longitudeRaw) {
    const lat = Number(latitudeRaw);
    const lng = Number(longitudeRaw);
    if (!latitudeRaw || !longitudeRaw || Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { error: "Latitude/longitude inválidas — preencha as duas ou nenhuma." };
    }
    coordenadas = `SRID=4326;POINT(${lng} ${lat})`;
  }

  return {
    campos: {
      alvara_numero: alvaraNumero,
      nome,
      tipologia,
      area_construida_m2: areaM2,
      fase,
      cno,
      inscricao_imobiliaria: inscricaoImobiliaria,
      coordenadas,
      data_alvara: opcional(formData, "dataAlvara"),
      data_inicio_obra: opcional(formData, "dataInicioObra"),
      data_final_obra: opcional(formData, "dataFinalObra"),
      tipo_alvara: opcional(formData, "tipoAlvara"),
      responsavel_exec_obra: opcional(formData, "responsavelExecObra"),
      cep: opcional(formData, "cep"),
      tipo_logradouro: opcional(formData, "tipoLogradouro"),
      logradouro: opcional(formData, "logradouro"),
      numero_imovel: opcional(formData, "numeroImovel"),
      complemento: opcional(formData, "complemento"),
      bairro: opcional(formData, "bairro"),
      area_categoria: opcional(formData, "areaCategoria"),
      area_destinacao: opcional(formData, "areaDestinacao"),
      area_tipo_obra: opcional(formData, "areaTipoObra"),
      resp_tecnico_tipo: opcional(formData, "respTecnicoTipo"),
      resp_tecnico_nome: opcional(formData, "respTecnicoNome"),
      resp_tecnico_registro: opcional(formData, "respTecnicoRegistro"),
      resp_tecnico_documento: opcional(formData, "respTecnicoDocumento"),
    },
  };
}

export async function criarObra(_prev: CriarObraState, formData: FormData): Promise<CriarObraState> {
  const db = await createServerSupabase();

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: perfil, error: perfilErr } = await db
    .from("perfis")
    .select("municipio_id")
    .eq("id", user.id)
    .single();
  if (perfilErr || !perfil?.municipio_id) {
    return { error: "Não foi possível identificar o município do seu usuário." };
  }

  const parsed = parseCamposObra(formData);
  if ("error" in parsed) return { error: parsed.error };

  let construtoraId = formData.get("construtoraId")?.toString();

  const novaConstrutora = formData.get("novaConstrutora") === "on";
  if (novaConstrutora) {
    const razaoSocial = formData.get("razaoSocial")?.toString().trim();
    const cnpjCpf = formData.get("cnpjCpf")?.toString().trim();
    const tipo = formData.get("tipoConstrutora")?.toString() || "pj";

    if (!razaoSocial || !cnpjCpf) {
      return { error: "Preencha razão social e CNPJ/CPF da construtora." };
    }

    const { data: nova, error: novaErr } = await db
      .from("construtoras")
      .insert({ razao_social: razaoSocial, cnpj_cpf: cnpjCpf, tipo })
      .select("id")
      .single();
    if (novaErr) return { error: `Construtora: ${novaErr.message}` };
    construtoraId = nova.id;
  }

  if (!construtoraId) {
    return { error: "Selecione uma construtora ou cadastre uma nova." };
  }

  const { error } = await db.from("obras").insert({
    municipio_id: perfil.municipio_id,
    construtora_id: construtoraId,
    ...parsed.campos,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "Já existe uma obra com esse alvará." : error.message };
  }

  revalidatePath("/obras");
  return { ok: true };
}

export async function atualizarObra(
  obraId: string,
  _prev: CriarObraState,
  formData: FormData,
): Promise<CriarObraState> {
  const db = await createServerSupabase();

  const parsed = parseCamposObra(formData);
  if ("error" in parsed) return { error: parsed.error };

  const construtoraId = formData.get("construtoraId")?.toString();
  if (!construtoraId) return { error: "Selecione uma construtora." };

  const { error } = await db
    .from("obras")
    .update({ construtora_id: construtoraId, ...parsed.campos })
    .eq("id", obraId);

  if (error) {
    return { error: error.message.includes("duplicate") ? "Já existe uma obra com esse alvará." : error.message };
  }

  revalidatePath("/obras");
  return { ok: true };
}

export interface ExcluirObraState {
  error?: string;
}

export async function excluirObra(obraId: string): Promise<ExcluirObraState> {
  const db = await createServerSupabase();
  const { error, count } = await db.from("obras").delete({ count: "exact" }).eq("id", obraId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Essa obra já tem inventário, fiscalização ou selo vinculado — não pode ser excluída.",
      };
    }
    return { error: error.message };
  }
  if (count === 0) {
    return { error: "Obra não encontrada ou sem permissão para excluir." };
  }

  revalidatePath("/obras");
  return {};
}
