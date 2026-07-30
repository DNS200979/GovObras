"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";

export interface CriarObraState {
  error?: string;
  ok?: boolean;
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

  const alvaraNumero = formData.get("alvaraNumero")?.toString().trim();
  const nome = formData.get("nome")?.toString().trim();
  const tipologia = formData.get("tipologia")?.toString();
  const areaM2 = Number(formData.get("areaM2"));
  const fase = formData.get("fase")?.toString() || "fundacao";
  const cno = formData.get("cno")?.toString().trim() || null;
  const inscricaoImobiliaria = formData.get("inscricaoImobiliaria")?.toString().trim() || null;

  if (!alvaraNumero || !nome || !tipologia || !areaM2 || areaM2 <= 0) {
    return { error: "Preencha alvará, nome, tipologia e área (m²)." };
  }

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
    alvara_numero: alvaraNumero,
    nome,
    tipologia,
    area_construida_m2: areaM2,
    fase,
    cno,
    inscricao_imobiliaria: inscricaoImobiliaria,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "Já existe uma obra com esse alvará." : error.message };
  }

  revalidatePath("/obras");
  return { ok: true };
}
