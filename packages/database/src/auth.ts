import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuth = ReturnType<typeof createNeonAuth>;

let instancia: NeonAuth | undefined;

/**
 * Instância do Neon Auth (Better Auth gerenciado) para Server Components,
 * Server Actions, Route Handlers e proxy. Criada sob demanda para o build não
 * exigir as variáveis. Cada app tem o seu domínio, então os cookies de sessão
 * não se misturam entre obra, gov e concreteira.
 */
export function getAuth(): NeonAuth {
  if (!instancia) {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!baseUrl || !secret) {
      throw new Error("Defina NEON_AUTH_BASE_URL e NEON_AUTH_COOKIE_SECRET (32+ caracteres).");
    }
    instancia = createNeonAuth({ baseUrl, cookies: { secret } });
  }
  return instancia;
}

export interface Usuario {
  id: string;
  email: string;
}

/** Usuário da sessão atual, ou `null`. Substitui `supabase.auth.getUser()`. */
export async function getUsuario(): Promise<Usuario | null> {
  const { data } = await getAuth().getSession();
  const user = data?.user;
  if (!user) return null;
  return { id: user.id, email: user.email };
}
