import { criarProxy } from "@carbonfree/database/proxy";

/**
 * Sem esse gate, uma conta de construtora autenticada renderizava toda a
 * interface da prefeitura (menus de Construtoras, Agendamento, Mesa de análise…).
 */
export const proxy = criarProxy({
  papeisPermitidos: ["prefeitura_analista", "prefeitura_gestor", "admin_plataforma"],
  destinoAposLogin: "/",
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
