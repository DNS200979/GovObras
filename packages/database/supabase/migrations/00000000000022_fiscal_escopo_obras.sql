-- Corrige duas coisas descobertas ao ligar o app do fiscal.
--
-- 1) Recursão infinita. A política de obras da migration 21 consultava
--    `fiscalizacoes`, e as políticas de `fiscalizacoes` consultam `obras`.
--    O Postgres avalia uma dentro da outra e aborta com 42P17. Quebramos o
--    ciclo com uma função security definer, que não dispara RLS na consulta
--    interna. Ela é segura porque não aceita usuário como parâmetro: usa
--    sempre auth.uid(), então ninguém consulta o escopo de outra pessoa.
--
-- 2) Escopo largo demais para o fiscal. `current_municipio_id()` lê o
--    municipio_id do perfil, e o perfil de fiscal também tem um — a política
--    "prefeitura vê as do município" checava só o município, sem olhar o
--    papel. Na prática o fiscal enxergava todas as obras do município (125
--    hoje), não apenas as que fiscaliza. Quem vai a um canteiro não precisa
--    da carteira inteira da prefeitura.

drop policy if exists "obras: fiscal vê as que fiscaliza" on obras;

create or replace function fiscal_designado_na_obra(p_obra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from fiscalizacoes
    where obra_id = p_obra_id
      and fiscal_id = auth.uid()
  );
$$;

-- Função em schema exposto recebe EXECUTE de PUBLIC por padrão; restringe a
-- quem está autenticado.
revoke execute on function fiscal_designado_na_obra(uuid) from public;
grant execute on function fiscal_designado_na_obra(uuid) to authenticated;

create policy "obras: fiscal vê as que fiscaliza" on obras
  for select
  using (fiscal_designado_na_obra(id));

-- Restringe a política da prefeitura ao papel que ela sempre pretendeu
-- atender. Analista e gestor seguem passando; o fiscal passa a depender
-- exclusivamente da política acima.
drop policy if exists "obras: prefeitura vê as do município" on obras;

create policy "obras: prefeitura vê as do município" on obras
  for select
  using (
    (municipio_id = current_municipio_id() and current_papel() like 'prefeitura_%')
    or is_admin()
  );
