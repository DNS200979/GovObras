"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";

export interface CriarRequisitoState {
  error?: string;
  ok?: boolean;
}

export async function criarRequisito(
  _prev: CriarRequisitoState,
  formData: FormData,
): Promise<CriarRequisitoState> {
  const natureza = formData.get("natureza")?.toString();
  const codigo = formData.get("codigo")?.toString().trim();
  const requisito = formData.get("requisito")?.toString().trim();
  const unidade = formData.get("unidade")?.toString().trim();
  const evidenciaPrimaria = formData.get("evidenciaPrimaria")?.toString().trim();
  const testeVerificacao = formData.get("testeVerificacao")?.toString().trim();

  if (
    (natureza !== "passivo" && natureza !== "ativo") ||
    !codigo ||
    !requisito ||
    !unidade ||
    !evidenciaPrimaria ||
    !testeVerificacao
  ) {
    return { error: "Preencha todos os campos." };
  }

  const db = await createServerSupabase();

  const { count } = await db
    .from("requisitos_auditoria")
    .select("*", { count: "exact", head: true })
    .eq("natureza", natureza);

  const { error } = await db.from("requisitos_auditoria").insert({
    natureza,
    codigo,
    requisito,
    unidade,
    evidencia_primaria: evidenciaPrimaria,
    teste_verificacao: testeVerificacao,
    ordem: count ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/requisitos");
  return { ok: true };
}
