import { HeaderUser as HeaderUserView } from "@carbonfree/ui/header-user";
import { sair } from "@/lib/auth-actions";
import { getSessaoConcreteira } from "@/lib/sessao";

export async function HeaderUser() {
  const sessao = await getSessaoConcreteira();
  if (!sessao) return null;

  return <HeaderUserView nome={sessao.nome} organizacao={sessao.concreteiraNome} sair={sair} />;
}
