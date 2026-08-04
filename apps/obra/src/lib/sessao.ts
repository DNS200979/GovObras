import { createServerSupabase } from "@carbonfree/database/server";

export interface SessaoConstrutora {
  userId: string;
  email: string;
  nome: string;
  papel: string;
  construtoraId: string;
  construtoraNome: string;
}

/** Perfis autorizados a operar o app Obra — mantido em sincronia com o check da tabela `perfis`. */
const PAPEIS_CONSTRUTORA = ["construtora_lancador", "construtora_rt"];

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * Lê a sessão atual e o perfil vinculado. `null` se não autenticado
 * (proxy.ts já bloqueia esse caso nas rotas privadas).
 *
 * Aceita um client já existente — criar mais de um `createServerSupabase()`
 * na mesma Server Action faz cada instância escrever cookies de sessão de
 * forma independente, e uma sobrescreve a outra (visto derrubando a sessão
 * inteira ao criar um projeto ESG). Sempre reutilize o client do chamador
 * quando ele já existir.
 */
export async function getSessaoConstrutora(
  clientExistente?: SupabaseServerClient,
): Promise<SessaoConstrutora | null> {
  const supabase = clientExistente ?? (await createServerSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, construtora_id, construtoras(razao_social)")
    .eq("id", user.id)
    .single();

  if (!perfil || !PAPEIS_CONSTRUTORA.includes(perfil.papel) || !perfil.construtora_id) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    nome: perfil.nome,
    papel: perfil.papel,
    construtoraId: perfil.construtora_id,
    construtoraNome: (perfil.construtoras as unknown as { razao_social: string } | null)?.razao_social ?? "",
  };
}
