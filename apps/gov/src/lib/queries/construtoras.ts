/** Construtoras com obra no município. */
import { createServerSupabase } from "@carbonfree/database/server";

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
