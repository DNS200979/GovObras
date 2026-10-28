import { criarProxy } from "@carbonfree/database/proxy";

/** Cada app só aceita o seu próprio tipo de conta (espelha o gate do Obra/Gov). */
export const proxy = criarProxy({
  papeisPermitidos: ["concreteira", "admin_plataforma"],
  destinoAposLogin: "/obras",
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
