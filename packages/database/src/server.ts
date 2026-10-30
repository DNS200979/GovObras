import { createClient } from "@supabase/supabase-js";
import { getAuth } from "./auth";
import type { Database } from "./types";

/** Margem antes do `exp` do JWT para pedir um novo (evita usar token prestes a vencer). */
const MARGEM_MS = 60_000;

function expiraEm(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Cliente do banco para Server Components / Route Handlers / Server Actions.
 *
 * Fala com a Data API do Neon (PostgREST) usando o JWT do usuário logado, então
 * as políticas RLS valem exatamente como valiam no Supabase — `auth.uid()` é o
 * `sub` do token. Sem sessão, as consultas falham (a Data API recusa).
 *
 * O JWT é buscado uma vez por cliente e reaproveitado até perto de vencer
 * (dura ~15 min); sem esse cache cada consulta custaria uma ida ao Neon Auth.
 *
 * `NEON_DATA_API_URL` é a URL mostrada no console (termina em /rest/v1).
 */
export async function createServerSupabase() {
  const apiUrl = process.env.NEON_DATA_API_URL;
  if (!apiUrl) throw new Error("Defina NEON_DATA_API_URL (URL da Data API do Neon).");

  let token: string | null = null;
  let vence = 0;

  return createClient<Database>(apiUrl.replace(/\/rest\/v1\/?$/, ""), "neon-data-api", {
    auth: { persistSession: false, autoRefreshToken: false },
    accessToken: async () => {
      if (token && Date.now() < vence - MARGEM_MS) return token;
      const { data } = await getAuth().token();
      token = data?.token ?? null;
      vence = token ? expiraEm(token) : 0;
      return token;
    },
  });
}
