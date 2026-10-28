# Migração para Neon — Fase 1 (banco)

Aplica o schema atual num Postgres do Neon sem editar `../supabase/migrations`.

0. **Ative a Data API do Neon no branch antes de tudo** (console → Data API, com Neon Auth e "Grant public schema access"; ou `provision_neon_data_api`). Ela cria as roles `authenticated`/`anonymous` e `auth.uid()`. Se essas roles já existirem, a ativação falha com "authenticated role already exists".
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


# Fase 3 — consultas (Data API do Neon)

Em vez de reescrever as ~124 consultas, `createServerSupabase()` agora devolve um cliente
`supabase-js` apontado para a **Data API do Neon** (PostgREST), autenticado com o JWT do usuário
(`getAuth().token()`). As chamadas `.from().select()` — inclusive embeds como `municipios(nome, uf)` —
e as políticas RLS (`auth.uid()` = `sub` do JWT) continuam valendo sem mudança.

Variável nova por app: `NEON_DATA_API_URL` (URL do console, termina em `/rest/v1`).

O que a Data API **não** cobre: Storage (`.storage.from()` — Fase 4) e um equivalente do `service_role`
(não há como ignorar RLS por ela; tarefas administrativas usam SQL direto com `DATABASE_URL`).
`apply.mjs` ajusta em memória as 3 linhas das migrações que dependem de `auth.users`/`auth.role()`,
porque o schema `auth` pertence ao Neon (cloud_admin).

## Seeds

Rodam direto no Postgres (dono do banco, ignora RLS — o papel que o `service_role` tinha) pelo adaptador
`scripts/lib/db-neon.mjs`, que aceita o subconjunto de `supabase-js` que os seeds usam.
Variáveis: `DATABASE_URL` (conexão **direta**, sem `-pooler`) e, para criar usuários, `NEON_AUTH_BASE_URL`.

| Script | Efeito |
|---|---|
| `seed-requisitos.mjs` | requisitos de auditoria (seções 5.1 e 5.2) |
| `seed.mjs` | Florianópolis, construtoras, obras, inventários, selos, fiscalizações (idempotente) |
| `seed-inventario-demo.mjs "<obra>"` | inventários de demonstração de uma obra |
| `seed-case-aracaju.mjs` / `seed-case-campinas.mjs` | cases de captação; exigem um `prefeitura_gestor` (use `criar-usuario.mjs`) e entram no município dele |

`scripts/seed-prefeitura-user.mjs` e `seed-construtora-user.mjs` ainda falam com o Supabase: use `neon/criar-usuario.mjs`.

## Cuidados com a Data API

- **Depois de qualquer migração nova, atualize o cache de schema** (console → Data API → *Refresh schema cache*). Sem isso funções e colunas novas não aparecem (`try reloading the schema`).
- Foram vistas poucas respostas **vazias** (não erro) na primeira consulta de uma sessão nova, em geral logo depois de ativar a Data API ou de gravar dados. Não reproduzível sob demanda; se uma tela aparecer vazia sem motivo, repita a consulta antes de investigar o RLS.
