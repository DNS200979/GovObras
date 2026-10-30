-- Camada de compatibilidade Supabase -> Neon.
--
-- As migrações em ../supabase/migrations assumem objetos que o Supabase
-- fornece. No Neon, a Data API (PostgREST) cria sozinha as roles
-- `authenticated`/`anonymous` e as funções auth.uid()/auth.jwt(); aqui só
-- recriamos o que ela NÃO cobre, para as migrações aplicarem sem edição:
--   - schema extensions (onde as migrações instalam postgis/vector)
--   - storage.* (tabelas e foldername das políticas dos buckets; some na Fase 4)
--
-- O schema `auth` pertence ao cloud_admin e não aceita objetos nossos: o que
-- as migrações pedem dele (auth.users, auth.role()) é ajustado em memória por
-- apply.mjs, sem editar os arquivos originais.
--
-- PRÉ-REQUISITO: a Data API do Neon já ativada no branch. Ela precisa criar a
-- role `authenticated` ela mesma — se a role existir antes, a ativação falha
-- ("authenticated role already exists"). Idempotente.

do $$
begin
  if not exists (select from pg_roles where rolname = 'authenticated') then
    raise exception 'Ative a Data API do Neon neste branch antes de aplicar o schema (ela cria a role authenticated).';
  end if;
end $$;

create schema if not exists extensions;
create schema if not exists storage;
grant usage on schema extensions, storage to authenticated;

-- storage: tabelas e helper que as políticas de bucket usam.
create table if not exists storage.buckets (
  id text primary key,
  name text not null unique,
  public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language plpgsql immutable as $$
declare
  _parts text[];
begin
  _parts := string_to_array(name, '/');
  return _parts[1:array_length(_parts, 1) - 1];
end
$$;

grant all on all tables in schema storage to authenticated;
grant execute on all functions in schema storage to authenticated;
