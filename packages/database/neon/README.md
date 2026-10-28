# Migração para Neon — Fase 1 (banco)

Aplica o schema atual num Postgres do Neon sem editar `../supabase/migrations`.

1. No Neon, crie o projeto (região `sa-east-1` se disponível) e copie a connection string **direta** (sem `-pooler`).
2. `DATABASE_URL="postgresql://..." node packages/database/neon/apply.mjs`
   (`--dry-run` lista o que seria aplicado; `--sem-vector` só para teste local, sem pgvector.)

`00_compat.sql` recria `auth`, `storage`, os papéis do Supabase e `auth.uid()`.
É provisório: some na Fase 2 (auth) e Fase 4 (storage).
Não migra dados — só schema, mais as linhas de referência que as próprias migrações inserem.

# Fase 2 — login (Neon Auth)

Usuários vivem em `neon_auth."user"` (Better Auth gerenciado); `perfis.id` aponta para lá
(`migrations/01_auth_neon.sql`). Cada app expõe `/api/auth/*` e usa `@carbonfree/database/proxy`.

Variáveis por app (obra, gov, concreteira):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | string do Neon **com** pooler |
| `NEON_AUTH_BASE_URL` | URL do Neon Auth do branch (console → Auth) |
| `NEON_AUTH_COOKIE_SECRET` | `openssl rand -base64 32` (um por app) |

Criar usuário: `node packages/database/neon/criar-usuario.mjs <email> <senha> "<nome>" <papel> ["<alvo>"]`.
Origens (domínios `*.vercel.app` e de produção) precisam estar nos *trusted domains* do Neon Auth.
