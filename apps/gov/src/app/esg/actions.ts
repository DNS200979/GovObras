"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";

export async function marcarEmAnalise(projetoId: string) {
  const db = await createServerSupabase();
  const { error } = await db
    .from("projetos_esg")
    .update({ status: "em_analise" })
    .eq("id", projetoId)
    .eq("status", "enviado");
  if (error) throw error;
  revalidatePath(`/esg/${projetoId}`);
  revalidatePath("/esg");
}

export interface DecidirState {
  error?: string;
}

export async function decidirProjeto(
  projetoId: string,
  novoStatus: "aprovado" | "rejeitado",
  _prev: DecidirState,
  formData: FormData,
): Promise<DecidirState> {
  const motivo = formData.get("motivo")?.toString().trim();

  if (novoStatus === "rejeitado" && !motivo) {
    return { error: "Informe o motivo da rejeição." };
  }

  const db = await createServerSupabase();
  const { error } = await db
    .from("projetos_esg")
    .update({
      status: novoStatus,
      decidido_em: new Date().toISOString(),
      motivo_decisao: motivo || null,
    })
    .eq("id", projetoId)
    .eq("status", "em_analise");

  if (error) return { error: error.message };

  revalidatePath(`/esg/${projetoId}`);
  revalidatePath("/esg");
  return {};
}
