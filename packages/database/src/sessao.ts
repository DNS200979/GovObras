import { createServerSupabase } from "./server";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

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
  /**
   * Client já existente do chamador. Criar mais de um `createServerSupabase()`
   * na mesma Server Action faz cada instância escrever cookies de sessão de
   * forma independente, e uma sobrescreve a outra (visto derrubando a sessão
   * inteira ao criar um projeto ESG). Sempre reutilize o do chamador.
   */
  client?: SupabaseServerClient;
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
  client,
}: LeituraDeSessao): Promise<SessaoDeOrganizacao | null> {
  const supabase = client ?? (await createServerSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select(`nome, papel, ${colunaId}, ${relacao}(razao_social)`)
    .eq("id", user.id)
    .single();

  if (!perfil) return null;

  const registro = perfil as unknown as Record<string, unknown>;
  const papel = String(registro.papel ?? "");
  const organizacaoId = registro[colunaId];

  if (!papeis.includes(papel) || typeof organizacaoId !== "string" || !organizacaoId) {
    return null;
  }

  const relacionada = registro[relacao] as { razao_social: string } | null;

  return {
    userId: user.id,
    email: user.email ?? "",
    nome: String(registro.nome ?? ""),
    papel,
    organizacaoId,
    organizacaoNome: relacionada?.razao_social ?? "",
  };
}
