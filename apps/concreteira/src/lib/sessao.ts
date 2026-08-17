import { createServerSupabase } from "@carbonfree/database/server";

export interface SessaoConcreteira {
  userId: string;
  email: string;
  nome: string;
  papel: string;
  concreteiraId: string;
  concreteiraNome: string;
}

/** Perfis autorizados a operar o app Concreteira — mantido em sincronia com o check da tabela `perfis`. */
const PAPEIS_CONCRETEIRA = ["concreteira"];

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * Lê a sessão atual e o perfil vinculado. `null` se não autenticado
 * (proxy.ts já bloqueia esse caso nas rotas privadas).
 *
 * Aceita um client já existente pelo mesmo motivo documentado no app Obra:
 * criar mais de um `createServerSupabase()` na mesma Server Action faz cada
 * instância escrever cookies de sessão de forma independente, e uma
 * sobrescreve a outra.
 */
export async function getSessaoConcreteira(
  clientExistente?: SupabaseServerClient,
): Promise<SessaoConcreteira | null> {
  const supabase = clientExistente ?? (await createServerSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, concreteira_id, concreteiras(razao_social)")
    .eq("id", user.id)
    .single();

  if (!perfil || !PAPEIS_CONCRETEIRA.includes(perfil.papel) || !perfil.concreteira_id) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    nome: perfil.nome,
    papel: perfil.papel,
    concreteiraId: perfil.concreteira_id,
    concreteiraNome: (perfil.concreteiras as unknown as { razao_social: string } | null)?.razao_social ?? "",
  };
}
