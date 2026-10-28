import { lerSessaoDeOrganizacao } from "@carbonfree/database/sessao";

export interface SessaoConcreteira {
  userId: string;
  email: string;
  nome: string;
  papel: string;
  concreteiraId: string;
  concreteiraNome: string;
}

/** Perfis autorizados a operar o app Concreteira — em sincronia com o check da tabela `perfis`. */
const PAPEIS_CONCRETEIRA = ["concreteira"] as const;

export async function getSessaoConcreteira(
  /** Ignorado: resquício do client do Supabase; sai junto com ele na Fase 3. */
  _clientExistente?: unknown,
): Promise<SessaoConcreteira | null> {
  const s = await lerSessaoDeOrganizacao({
    papeis: PAPEIS_CONCRETEIRA,
    colunaId: "concreteira_id",
    relacao: "concreteiras",
  });
  if (!s) return null;

  return {
    userId: s.userId,
    email: s.email,
    nome: s.nome,
    papel: s.papel,
    concreteiraId: s.organizacaoId,
    concreteiraNome: s.organizacaoNome,
  };
}
