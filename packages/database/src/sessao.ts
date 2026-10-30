import { getUsuario } from "./auth";
import { getSql } from "./db";

/** O que a leitura de sessão devolve, antes de cada app dar o nome do seu domínio. */
export interface SessaoDeOrganizacao {
  userId: string;
  email: string;
  nome: string;
  papel: string;
  organizacaoId: string;
  organizacaoNome: string;
}

export interface LeituraDeSessao {
  /** Papéis autorizados a operar o app — em sincronia com o check da tabela `perfis`. */
  papeis: readonly string[];
  /** Coluna de `perfis` que aponta para a organização (ex.: "construtora_id"). */
  colunaId: string;
  /** Tabela relacionada de onde sai a razão social (ex.: "construtoras"). */
  relacao: string;
}

/**
 * Lê a sessão e o perfil vinculado a uma organização, comum aos apps de
 * construtora e de concreteira — que diferem só na tabela e nos papéis.
 *
 * `null` se não autenticado, se o papel não for aceito por este app, ou se o
 * perfil não estiver vinculado a nenhuma organização. O `proxy.ts` de cada app
 * já bloqueia o primeiro caso nas rotas privadas.
 */
export async function lerSessaoDeOrganizacao({
  papeis,
  colunaId,
  relacao,
}: LeituraDeSessao): Promise<SessaoDeOrganizacao | null> {
  const user = await getUsuario();
  if (!user) return null;

  // Nomes de coluna/tabela vêm de constantes dos apps, nunca de entrada do usuário;
  // a checagem protege contra um erro de digitação virar SQL malformado.
  if (!/^[a-z_]+$/.test(colunaId) || !/^[a-z_]+$/.test(relacao)) {
    throw new Error("colunaId/relacao inválidos.");
  }

  const rows = await getSql().query(
    `select p.nome, p.papel, p.${colunaId} as organizacao_id, r.razao_social
       from perfis p
       left join ${relacao} r on r.id = p.${colunaId}
      where p.id = $1`,
    [user.id],
  );
  const perfil = rows[0] as
    | { nome: string; papel: string; organizacao_id: string | null; razao_social: string | null }
    | undefined;
  if (!perfil) return null;

  const papel = String(perfil.papel ?? "");
  const organizacaoId = perfil.organizacao_id;

  if (!papeis.includes(papel) || typeof organizacaoId !== "string" || !organizacaoId) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    nome: String(perfil.nome ?? ""),
    papel,
    organizacaoId,
    organizacaoNome: perfil.razao_social ?? "",
  };
}
