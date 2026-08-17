import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@carbonfree/database/middleware";

const PUBLIC_PATHS = ["/login"];

/** Papéis que podem operar o CarbonFree Concreteiras — espelha o gate do Obra/Gov. */
const PAPEIS_PERMITIDOS = ["concreteira", "admin_plataforma"];

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: perfil } = await supabase.from("perfis").select("papel").eq("id", user.id).single();

    if (!perfil || !PAPEIS_PERMITIDOS.includes(perfil.papel)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("erro", "papel");
      const redirecionamento = NextResponse.redirect(url);
      // supabase.auth.signOut() escreveria os cookies limpos no `response`
      // interno do createMiddlewareSupabase — que é descartado ao retornar
      // outra resposta. Limpar aqui é o que de fato encerra a sessão.
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-")) redirecionamento.cookies.delete(cookie.name);
      }
      return redirecionamento;
    }

    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/obras";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
