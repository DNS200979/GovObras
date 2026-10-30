-- Fase 2: usuários passam a viver em neon_auth."user" (Better Auth gerenciado).
-- perfis.id referencia essa tabela (uuid, o mesmo tipo de antes: nenhuma coluna
-- muda). Só roda no Neon — o schema neon_auth não existe no Supabase.
-- (apply.mjs já remove de perfis a FK antiga para auth.users.)

alter table public.perfis
  drop constraint if exists perfis_id_neon_auth_fkey;
alter table public.perfis
  add constraint perfis_id_neon_auth_fkey
  foreign key (id) references neon_auth."user" (id) on delete cascade;
