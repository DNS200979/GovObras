-- Advisor `auth_rls_initplan`: as 11 policies que chamavam auth.uid() direto
-- na expressão passam a chamá-la como (select auth.uid()).
--
-- Sem o select, o Postgres avalia a função uma vez POR LINHA avaliada pela
-- policy; embrulhada, vira um InitPlan avaliado uma vez por statement.
--
-- Esta migration é MECÂNICA e preserva a semântica exatamente. O SQL abaixo
-- não foi redigitado: cada expressão foi extraída de `pg_policies` (ou seja,
-- decompilada pelo próprio Postgres a partir do que estava em produção) e
-- transformada por substituição de `auth.<fn>()` por `(select auth.<fn>())`.
-- Nada mais mudou — nem predicado, nem papel, nem permissividade.
--
-- Uma tautologia herdada (`oc.obra_id = oc.obra_id` em entregas_concreto)
-- é reproduzida aqui de propósito, para que esta migration continue sendo
-- só performance. A correção dela é a migration 34.

drop policy "concreteira_esg: concreteira cria os próprios" on concreteira_esg;
create policy "concreteira_esg: concreteira cria os próprios" on concreteira_esg
  as permissive for insert to public
  with check (((concreteira_id = current_concreteira_id()) AND (criado_por = (select auth.uid())) AND (current_papel() = 'concreteira'::text)));

drop policy "concreteira_esg_documentos: concreteira anexa nos próprios ite" on concreteira_esg_documentos;
create policy "concreteira_esg_documentos: concreteira anexa nos próprios ite" on concreteira_esg_documentos
  as permissive for insert to public
  with check (((enviado_por = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM concreteira_esg
  WHERE ((concreteira_esg.id = concreteira_esg_documentos.item_id) AND (concreteira_esg.concreteira_id = current_concreteira_id()))))));

drop policy "entregas_concreto: concreteira declara nos próprios vínculos" on entregas_concreto;
create policy "entregas_concreto: concreteira declara nos próprios vínculos" on entregas_concreto
  as permissive for insert to public
  with check (((criado_por = (select auth.uid())) AND (concreteira_id = current_concreteira_id()) AND (current_papel() = 'concreteira'::text) AND (EXISTS ( SELECT 1
   FROM obra_concreteiras oc
  WHERE ((oc.id = entregas_concreto.obra_concreteira_id) AND (oc.concreteira_id = current_concreteira_id()) AND (oc.obra_id = oc.obra_id) AND (oc.status = 'ativo'::text))))));

drop policy "fiscalizacoes: fiscal vê as próprias" on fiscalizacoes;
create policy "fiscalizacoes: fiscal vê as próprias" on fiscalizacoes
  as permissive for select to public
  using ((fiscal_id = (select auth.uid())));

drop policy "fiscalizacoes: só fiscal designado insere constatação" on fiscalizacoes;
create policy "fiscalizacoes: só fiscal designado insere constatação" on fiscalizacoes
  as permissive for update to public
  using ((fiscal_id = (select auth.uid())))
  with check ((fiscal_id = (select auth.uid())));

drop policy "obra_concreteiras: construtora vincula na própria obra" on obra_concreteiras;
create policy "obra_concreteiras: construtora vincula na própria obra" on obra_concreteiras
  as permissive for insert to public
  with check (((convidado_por = (select auth.uid())) AND (current_papel() = ANY (ARRAY['construtora_lancador'::text, 'construtora_rt'::text])) AND (EXISTS ( SELECT 1
   FROM obras
  WHERE ((obras.id = obra_concreteiras.obra_id) AND (obras.construtora_id = current_construtora_id()))))));

drop policy "obra_documentos: construtora anexa nas próprias obras" on obra_documentos;
create policy "obra_documentos: construtora anexa nas próprias obras" on obra_documentos
  as permissive for insert to public
  with check (((enviado_por = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM obras
  WHERE ((obras.id = obra_documentos.obra_id) AND (obras.construtora_id = current_construtora_id()))))));

drop policy "perfis: vê o próprio" on perfis;
create policy "perfis: vê o próprio" on perfis
  as permissive for select to public
  using (((id = (select auth.uid())) OR is_admin()));

drop policy "projeto_esg_documentos: construtora anexa nos próprios projeto" on projeto_esg_documentos;
create policy "projeto_esg_documentos: construtora anexa nos próprios projeto" on projeto_esg_documentos
  as permissive for insert to public
  with check (((enviado_por = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM projetos_esg
  WHERE ((projetos_esg.id = projeto_esg_documentos.projeto_id) AND (projetos_esg.construtora_id = current_construtora_id()) AND (projetos_esg.status = ANY (ARRAY['rascunho'::text, 'enviado'::text])))))));

drop policy "projetos_captacao: prefeitura cria no próprio município" on projetos_captacao;
create policy "projetos_captacao: prefeitura cria no próprio município" on projetos_captacao
  as permissive for insert to public
  with check (((current_papel() = ANY (ARRAY['prefeitura_analista'::text, 'prefeitura_gestor'::text])) AND (municipio_id = current_municipio_id()) AND (criado_por = (select auth.uid()))));

drop policy "projetos_esg: construtora cria nas próprias obras" on projetos_esg;
create policy "projetos_esg: construtora cria nas próprias obras" on projetos_esg
  as permissive for insert to public
  with check (((construtora_id = current_construtora_id()) AND (criado_por = (select auth.uid())) AND (current_papel() = ANY (ARRAY['construtora_lancador'::text, 'construtora_rt'::text])) AND (EXISTS ( SELECT 1
   FROM obras
  WHERE ((obras.id = projetos_esg.obra_id) AND (obras.construtora_id = current_construtora_id()))))));

