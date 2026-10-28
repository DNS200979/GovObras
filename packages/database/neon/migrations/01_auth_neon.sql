-- Fase 2: usuários passam a viver em neon_auth."user" (Better Auth gerenciado).
-- perfis.id deixa de apontar para o auth.users de compatibilidade e passa a
-- apontar para neon_auth."user" — ambos uuid, então nenhuma coluna muda.
-- Só roda no Neon (o schema neon_auth não existe no Supabase).

do $$
declare
  c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.perfis'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass;
  if c is not null then
    execute format('alter table public.perfis drop constraint %I', c);
  end if;
end $$;

alter table public.perfis
  drop constraint if exists perfis_id_neon_auth_fkey;
alter table public.perfis
  add constraint perfis_id_neon_auth_fkey
  foreign key (id) references neon_auth."user" (id) on delete cascade;
