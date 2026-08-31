import { lerSessaoDeOrganizacao } from "@carbonfree/database/sessao";
import type { createServerSupabase } from "@carbonfree/database/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

export interface SessaoConstrutora {
  userId: string;
  email: string;
  nome: string;
  papel: string;
  construtoraId: string;
  construtoraNome: string;
}

/** Perfis autorizados a operar o app Obra — em sincronia com o check da tabela `perfis`. */
const PAPEIS_CONSTRUTORA = ["construtora_lancador", "construtora_rt"] as const;

export async function getSessaoConstrutora(
  clientExistente?: SupabaseServerClient,
): Promise<SessaoConstrutora | null> {
  const s = await lerSessaoDeOrganizacao({
    papeis: PAPEIS_CONSTRUTORA,
    colunaId: "construtora_id",
    relacao: "construtoras",
    client: clientExistente,
  });
  if (!s) return null;

  return {
    userId: s.userId,
    email: s.email,
    nome: s.nome,
    papel: s.papel,
    construtoraId: s.organizacaoId,
    construtoraNome: s.organizacaoNome,
  };
}
