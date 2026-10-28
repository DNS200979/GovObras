# Migração para Neon — Fase 1 (banco)

Aplica o schema atual num Postgres do Neon sem editar `../supabase/migrations`.

1. No Neon, crie o projeto (região `sa-east-1` se disponível) e copie a connection string **direta** (sem `-pooler`).
2. `DATABASE_URL="postgresql://..." node packages/database/neon/apply.mjs`
   (`--dry-run` lista o que seria aplicado; `--sem-vector` só para teste local, sem pgvector.)

`00_compat.sql` recria `auth`, `storage`, os papéis do Supabase e `auth.uid()`.
É provisório: some na Fase 2 (auth) e Fase 4 (storage).
Não migra dados — só schema, mais as linhas de referência que as próprias migrações inserem.
