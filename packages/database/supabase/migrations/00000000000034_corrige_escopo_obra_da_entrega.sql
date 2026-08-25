-- Corrige uma tautologia na policy de INSERT de `entregas_concreto`.
--
-- A migration 24 escreveu, dentro do EXISTS:
--
--     and oc.obra_id = obra_id
--
-- Como `obra_id` está sem qualificação e a subquery tem `obra_concreteiras oc`
-- no escopo mais interno, o Postgres resolve os DOIS lados para `oc.obra_id`.
-- A condição vira `oc.obra_id = oc.obra_id` — sempre verdadeira, sem efeito.
-- Dá para confirmar isso lendo a policy decompilada em `pg_policies`.
--
-- A intenção era amarrar a obra declarada na entrega à obra do vínculo. Sem
-- isso, uma concreteira com um vínculo ativo legítimo podia inserir entrega
-- apontando `obra_id` para QUALQUER obra, inclusive de outra construtora —
-- e a entrega apareceria no escopo de quem não deveria vê-la, já que as
-- policies de SELECT de construtora e prefeitura filtram justamente por
-- `entregas_concreto.obra_id`.
--
-- Nenhuma linha existente foi afetada: a tabela tem 0 entregas, então o bug
-- nunca chegou a ser exercido. A correção é preventiva.
--
-- Separada da migration 33 de propósito: aquela é performance e preserva
-- semântica; esta muda o que é aceito, e merece ser revisada por si só.

drop policy "entregas_concreto: concreteira declara nos próprios vínculos" on entregas_concreto;

create policy "entregas_concreto: concreteira declara nos próprios vínculos" on entregas_concreto
  as permissive for insert to public
  with check (
    criado_por = (select auth.uid())
    and concreteira_id = (select current_concreteira_id())
    and (select current_papel()) = 'concreteira'
    and exists (
      select 1
      from obra_concreteiras oc
      where oc.id = entregas_concreto.obra_concreteira_id
        and oc.concreteira_id = (select current_concreteira_id())
        and oc.obra_id = entregas_concreto.obra_id   -- <- era `obra_id`, que resolvia para oc.obra_id
        and oc.status = 'ativo'
    )
  );
