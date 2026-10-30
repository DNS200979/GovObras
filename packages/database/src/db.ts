import { neon } from "@neondatabase/serverless";

/**
 * SQL direto no Postgres do Neon (HTTP, serve em funções serverless).
 * `DATABASE_URL` deve ser a string com pooler. Autorização é responsabilidade
 * do chamador: não há RLS por sessão neste caminho.
 */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL (string do Neon).");
  return neon(url);
}

export interface PerfilDeAcesso {
  nome: string;
  papel: string;
}

/** Perfil (papel) de um usuário — usado pelo proxy e pelo login de cada app. */
export async function buscarPerfil(userId: string): Promise<PerfilDeAcesso | null> {
  const sql = getSql();
  const rows = await sql`select nome, papel from perfis where id = ${userId}`;
  return (rows[0] as PerfilDeAcesso | undefined) ?? null;
}
