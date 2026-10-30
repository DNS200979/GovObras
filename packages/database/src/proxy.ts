import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "./auth";
import { buscarPerfil } from "./db";

export interface ConfigProxy {
  /** Papéis que podem operar este app — cada app só aceita o seu tipo de conta. */
  papeisPermitidos: readonly string[];
  /** Para onde vai quem já está logado e abre /login. */
  destinoAposLogin: string;
}

const PUBLIC_PATHS = ["/login"];
// A rota /api/auth é o proxy do SDK para o Neon Auth: precisa passar sem checagem.
const AUTH_API = "/api/auth";
const COOKIE_PREFIX = "__Secure-neon-auth";

/**
 * Cria o `proxy` (Next 16) de um app: exige sessão nas rotas privadas e confere
 * o papel do perfil. Conta de outro tipo é devolvida ao /login com `erro=papel`.
 */
export function criarProxy({ papeisPermitidos, destinoAposLogin }: ConfigProxy) {
  return async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith(AUTH_API)) return NextResponse.next();

    const { data } = await getAuth().getSession();
    const user = data?.user;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user) {
      const perfil = await buscarPerfil(user.id);

      if (!perfil || !papeisPermitidos.includes(perfil.papel)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        url.searchParams.set("erro", "papel");
        const redirecionamento = NextResponse.redirect(url);
        // Encerrar a sessão aqui é limpar os cookies do Neon Auth na resposta
        // que de fato é devolvida (signOut() gravaria em outra, descartada).
        for (const cookie of request.cookies.getAll()) {
          if (cookie.name.startsWith(COOKIE_PREFIX)) redirecionamento.cookies.delete(cookie.name);
        }
        return redirecionamento;
      }

      if (pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = destinoAposLogin;
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  };
}
