-- Fecha as lacunas de RLS que hoje são contornadas com o client de service
-- role no app. Em cada caso a checagem de posse já existia — só que em código
-- TypeScript, fora do banco. Aqui ela passa a ser aplicada pelo Postgres.
--
-- Depois desta migration, três usos de `createAdminClient()` saem do app:
--   apps/obra/src/app/concreteiras/actions.ts       (busca por CNPJ, insert em lancamentos)
--   apps/concreteira/src/app/entregas/actions.ts    (insert em evidencias)
--
-- O quarto uso (leitura de `alternativas_material`) não precisava de migration:
-- a policy "leitura autenticada" já existe desde a migration 3.
--
-- As chamadas a helper vão embrulhadas em `(select ...)` — é o padrão que o
-- advisor do Supabase pede, para a função ser avaliada uma vez por statement
-- em vez de uma vez por linha.

-- ---------- concreteiras: achar por CNPJ para vincular ----------

-- A policy de `concreteiras` só deixa a construtora enxergar as que ela já
-- vinculou — então vincular uma concreteira nova (cadastrada por outra
-- construtora) era impossível sem service role.
--
-- Esta função devolve SÓ o id, e só para quem é construtora. A informação
-- exposta é "existe alguém com este CNPJ", que o chamador já está prestes a
-- descobrir de qualquer jeito ao tentar cadastrar (o CNPJ é unique).
create or replace function buscar_concreteira_por_cnpj(p_cnpj text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from concreteiras c
  where c.cnpj = p_cnpj
    and (select current_papel()) in ('construtora_lancador', 'construtora_rt');
$$;

revoke execute on function buscar_concreteira_por_cnpj(text) from public;
grant execute on function buscar_concreteira_por_cnpj(text) to authenticated;

-- ---------- lancamentos: o RT grava no inventário aberto da própria obra ----------

-- `lancamentos` é o ledger e não tinha NENHUMA policy de INSERT (só leitura),
-- o que forçava a materialização de entrega a passar por service role.
--
-- As mesmas quatro condições que o app já checava em código, agora no banco:
-- ser RT, o inventário ser de obra da própria construtora, e o inventário
-- estar aberto (rascunho ou em análise). Homologado não recebe lançamento.
create policy "lancamentos: RT grava no inventário aberto da própria obra" on lancamentos
  for insert to authenticated
  with check (
    (select current_papel()) = 'construtora_rt'
    and exists (
      select 1
      from inventarios i
      join obras o on o.id = i.obra_id
      where i.id = lancamentos.inventario_id
        and o.construtora_id = (select current_construtora_id())
        and i.status in ('rascunho', 'em_analise')
    )
  );

-- Continua sem UPDATE e sem DELETE de propósito: lançamento é imutável.

-- ---------- evidencias: a concreteira anexa a NF-e/CT-e da entrega ----------

-- `evidencias` tinha só policy de SELECT. A concreteira precisa gravar a nota
-- da entrega que declarou, e só nas obras em que está vinculada — que é
-- exatamente o que `concreteira_vinculada_na_obra` já responde.
create policy "evidencias: concreteira anexa na obra vinculada" on evidencias
  for insert to authenticated
  with check (
    (select current_concreteira_id()) is not null
    and (select concreteira_vinculada_na_obra(evidencias.obra_id))
  );

-- A concreteira não ganha UPDATE nem DELETE: uma vez anexada, a evidência é
-- imutável para ela. O vínculo com a entrega continua governado pelo trigger
-- `entrega_concreto_so_evidencia_pos_validacao` (migration 27/29).
