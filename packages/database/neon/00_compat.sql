-- Camada de compatibilidade Supabase -> Postgres puro (Neon).
--
-- As migrações em ../supabase/migrations assumem objetos que o Supabase
-- fornece: schemas auth/storage/extensions, os papéis anon/authenticated/
-- service_role, auth.uid() e auth.users. Aqui recriamos o mínimo para elas
-- aplicarem sem edição. É provisório:
--   Fase 2 (login)   -> auth.users deixa de existir (vira a tabela do Better Auth)
--   Fase 4 (storage) -> storage.* deixa de existir (arquivos vão para o R2)
-- Idempotente: pode rodar mais de uma vez.

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

-- O Supabase concede isto por padrão; as migrações contam com isso.
grant usage on schema public, extensions, auth, storage to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- auth.users: só o que as migrações referenciam (FK de perfis.id).
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Identidade da requisição, lida dos mesmos GUCs do PostgREST. Quem conecta
-- como usuário final define `request.jwt.claims` por transação; o servidor
-- (service_role / dono) ignora RLS e não precisa deles.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )
$$;

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

grant all on all tables in schema auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth, storage to anon, authenticated, service_role;
