-- Visibilidade da prefeitura sobre concreteiras — item que tinha ficado
-- fora de escopo desde o submódulo original. A prefeitura já enxerga
-- construtoras com obra no município (migration 02); aqui é o mesmo
-- raciocínio pra concreteiras, entregas e o scorecard ESG publicado.
--
-- Sem security definer nas policies de `concreteiras`/`obra_concreteiras`/
-- `entregas_concreto`: são checks diretos contra `obras`, e a policy de
-- `obras` pro ramo prefeitura não referencia essas tabelas de volta — não
-- há ciclo (diferente do caso do fiscal na migration 22).

-- ---------- concreteiras ----------

create policy "concreteiras: prefeitura vê as com obra no município" on concreteiras
  for select using (
    exists (
      select 1 from obra_concreteiras oc
      join obras o on o.id = oc.obra_id
      where oc.concreteira_id = concreteiras.id
        and o.municipio_id = current_municipio_id()
    )
  );

-- ---------- obra_concreteiras ----------

create policy "obra_concreteiras: prefeitura vê as do município" on obra_concreteiras
  for select using (
    exists (select 1 from obras where obras.id = obra_concreteiras.obra_id and obras.municipio_id = current_municipio_id())
  );

-- ---------- entregas_concreto ----------

create policy "entregas_concreto: prefeitura vê as do município" on entregas_concreto
  for select using (
    exists (select 1 from obras where obras.id = entregas_concreto.obra_id and obras.municipio_id = current_municipio_id())
  );

-- `entrega_composicao` já filtra por escopo da entrega (migration 24) sem
-- cobrir prefeitura — acrescenta o ramo dela em vez de reescrever a policy.
create policy "entrega_composicao: prefeitura vê a do município" on entrega_composicao
  for select using (
    exists (
      select 1 from entregas_concreto e
      join obras o on o.id = e.obra_id
      where e.id = entrega_composicao.entrega_id
        and o.municipio_id = current_municipio_id()
    )
  );

-- ---------- concreteira_esg: só publicado, mesma regra que vale pra construtora ----------

create or replace function concreteira_atua_no_municipio(p_concreteira_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from obra_concreteiras oc
    join obras o on o.id = oc.obra_id
    where oc.concreteira_id = p_concreteira_id
      and o.municipio_id = current_municipio_id()
      and oc.status = 'ativo'
  );
$$;

revoke execute on function concreteira_atua_no_municipio(uuid) from public;
grant execute on function concreteira_atua_no_municipio(uuid) to authenticated;

create policy "concreteira_esg: prefeitura vê os publicados do município" on concreteira_esg
  for select using (
    status = 'publicado' and concreteira_atua_no_municipio(concreteira_id)
  );

create policy "concreteira_esg_documentos: prefeitura vê os publicados do município" on concreteira_esg_documentos
  for select using (
    exists (
      select 1 from concreteira_esg
      where concreteira_esg.id = concreteira_esg_documentos.item_id
        and concreteira_esg.status = 'publicado'
        and concreteira_atua_no_municipio(concreteira_esg.concreteira_id)
    )
  );

-- ---------- storage: prefeitura lê os arquivos que já pode ver via tabela ----------

create policy "entregas-concreto-docs: prefeitura lê arquivos do município" on storage.objects
  for select
  using (
    bucket_id = 'entregas-concreto-docs'
    and exists (
      select 1 from entregas_concreto e
      join obras o on o.id = e.obra_id
      where e.concreteira_id::text = (storage.foldername(name))[1]
        and e.id::text = (storage.foldername(name))[2]
        and o.municipio_id = current_municipio_id()
    )
  );

create policy "concreteira-esg-docs: prefeitura lê os publicados do município" on storage.objects
  for select
  using (
    bucket_id = 'concreteira-esg-docs'
    and exists (
      select 1 from concreteira_esg
      where concreteira_esg.concreteira_id::text = (storage.foldername(name))[1]
        and concreteira_esg.id::text = (storage.foldername(name))[2]
        and concreteira_esg.status = 'publicado'
        and concreteira_atua_no_municipio(concreteira_esg.concreteira_id)
    )
  );
