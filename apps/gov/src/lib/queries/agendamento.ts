/** Vistorias programadas e os selects que alimentam o formulário. */
import { createServerSupabase } from "@carbonfree/database/server";

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
