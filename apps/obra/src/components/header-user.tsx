import { HeaderUser as HeaderUserView } from "@carbonfree/ui/header-user";
import { sair } from "@/lib/auth-actions";
import { getSessaoConstrutora } from "@/lib/sessao";

export async function HeaderUser() {
  const sessao = await getSessaoConstrutora();
  if (!sessao) return null;

  return <HeaderUserView nome={sessao.nome} organizacao={sessao.construtoraNome} sair={sair} />;
}
