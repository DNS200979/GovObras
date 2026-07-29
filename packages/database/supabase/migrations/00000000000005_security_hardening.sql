-- Correções apontadas pelo advisor de segurança do Supabase e pelo skill
-- oficial de boas práticas:
--
-- 1) bloquear_update_delete() sem search_path fixo (WARN do advisor).
-- 2) auth.role() = 'authenticated' está deprecado — quebra silenciosamente
--    com anonymous sign-ins habilitado, pois usuários anônimos também
--    carregam a role 'authenticated'. Troca pela cláusula `to authenticated`.
--
-- Os 4 helpers (current_papel/current_municipio_id/current_construtora_id/
-- is_admin) continuam SECURITY DEFINER de propósito: são o padrão
-- recomendado pela própria Supabase para evitar recursão infinita, já que
-- a policy de `perfis` ("vê o próprio") chama is_admin(), que chama
-- current_papel(), que faria SELECT em perfis de novo se fosse INVOKER.

create or replace function bloquear_update_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception '% é append-only: UPDATE e DELETE não são permitidos', tg_table_name;
end;
$$;

drop policy if exists "fatores: leitura autenticada" on fatores_emissao;
create policy "fatores: leitura autenticada" on fatores_emissao
  for select to authenticated using (true);

drop policy if exists "alternativas_material: leitura autenticada" on alternativas_material;
create policy "alternativas_material: leitura autenticada" on alternativas_material
  for select to authenticated using (true);
