/** Catálogo de requisitos auditáveis (seções 5.1/5.2 do plano). */
import { createServerSupabase } from "@carbonfree/database/server";

/**
 * O banco declara `natureza` como `text`, mas a coluna tem
 * `check (natureza in ('passivo','ativo'))` — a união é garantida pelo
 * Postgres, e o tipo gerado só não consegue expressar isso.
 */
type Natureza = "passivo" | "ativo";
const comoNatureza = (v: string): Natureza => v as Natureza;

export interface RequisitoAuditoria {
  id: string;
  natureza: "passivo" | "ativo";
  codigo: string;
  requisito: string;
  unidade: string;
  evidenciaPrimaria: string;
  testeVerificacao: string;
}

export async function getRequisitosAuditoria(): Promise<RequisitoAuditoria[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("requisitos_auditoria")
    .select("id, natureza, codigo, requisito, unidade, evidencia_primaria, teste_verificacao")
    .order("natureza")
    .order("ordem");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    natureza: comoNatureza(r.natureza),
    codigo: r.codigo,
    requisito: r.requisito,
    unidade: r.unidade,
    evidenciaPrimaria: r.evidencia_primaria,
    testeVerificacao: r.teste_verificacao,
  }));
}
