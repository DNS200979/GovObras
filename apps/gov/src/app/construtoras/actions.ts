"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";

export interface CriarConstrutoraState {
  error?: string;
  ok?: boolean;
}

export async function criarConstrutora(
  _prev: CriarConstrutoraState,
  formData: FormData,
): Promise<CriarConstrutoraState> {
  const razaoSocial = formData.get("razaoSocial")?.toString().trim();
  const cnpjCpf = formData.get("cnpjCpf")?.toString().trim();
  const tipo = formData.get("tipo")?.toString() || "pj";

  if (!razaoSocial || !cnpjCpf) {
    return { error: "Preencha razão social e CNPJ/CPF." };
  }

  const db = await createServerSupabase();
  const { error } = await db.from("construtoras").insert({
    razao_social: razaoSocial,
    cnpj_cpf: cnpjCpf,
    tipo,
  });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Já existe uma construtora com esse CNPJ/CPF."
        : error.message,
    };
  }

  revalidatePath("/construtoras");
  revalidatePath("/obras");
  return { ok: true };
}
