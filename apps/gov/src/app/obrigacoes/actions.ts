"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";

export interface RegistrarEnvioState {
  error?: string;
  ok?: boolean;
}

/**
 * Registra o protocolo devolvido pela Receita depois da transmissão.
 * A transmissão em si acontece fora daqui (assinatura com e-CNPJ + SOAP);
 * este registro é o que fecha a competência e serve de comprovação.
 */
export async function registrarEnvio(
  competencia: string,
  tipo: "lote" | "sem_movimento",
  totalAlvaras: number,
  _prev: RegistrarEnvioState,
  formData: FormData,
): Promise<RegistrarEnvioState> {
  const protocolo = formData.get("protocolo")?.toString().trim();
  if (!protocolo) return { error: "Informe o número do protocolo devolvido pela Receita." };

  const db = await createServerSupabase();

  const {
    data: { user },
  } = await db.auth.getUser();
  const { data: municipio } = await db.from("municipios").select("id").single();
  if (!municipio) return { error: "Município não encontrado." };

  const { error } = await db.from("sisobra_envios").upsert(
    {
      municipio_id: municipio.id,
      competencia,
      tipo,
      status: "transmitido",
      protocolo,
      total_alvaras: totalAlvaras,
      transmitido_em: new Date().toISOString(),
      registrado_por: user?.id ?? null,
      mensagem_erro: null,
    },
    { onConflict: "municipio_id,competencia" },
  );

  if (error) return { error: error.message };

  revalidatePath("/obrigacoes");
  return { ok: true };
}
