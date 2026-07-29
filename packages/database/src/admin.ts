import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com service role — ignora RLS.
 *
 * Uso temporário nos Server Components dos dashboards enquanto não existe
 * autenticação (ver README, "Próximos passos"). Quando o login existir,
 * trocar essas leituras por `createServerSupabase()` (RLS por sessão real),
 * já que hoje um usuário anônimo não enxerga nenhuma linha (verificado).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
