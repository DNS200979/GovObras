"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@carbonfree/database/admin";

export interface CriarVistoriaState {
  error?: string;
  ok?: boolean;
}

export async function criarVistoria(
  _prev: CriarVistoriaState,
  formData: FormData,
): Promise<CriarVistoriaState> {
  const obraId = formData.get("obraId")?.toString();
  const fiscalId = formData.get("fiscalId")?.toString();
  const data = formData.get("data")?.toString();
  const hora = formData.get("hora")?.toString() || "09:00";

  if (!obraId || !fiscalId || !data) {
    return { error: "Preencha obra, fiscal e data." };
  }

  const agendadoPara = new Date(`${data}T${hora}:00`);
  if (Number.isNaN(agendadoPara.getTime())) {
    return { error: "Data inválida." };
  }

  const db = createAdminClient();
  const { error } = await db.from("fiscalizacoes").insert({
    obra_id: obraId,
    fiscal_id: fiscalId,
    agendado_para: agendadoPara.toISOString(),
    status: "agendada",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agendamento");
  return { ok: true };
}

export async function cancelarVistoria(id: string) {
  const db = createAdminClient();
  await db.from("fiscalizacoes").update({ status: "cancelada" }).eq("id", id);
  revalidatePath("/agendamento");
}
