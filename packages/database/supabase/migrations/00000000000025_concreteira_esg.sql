-- Scorecard ESG da concreteira como empresa (certificações, políticas
-- ambientais/sociais, documentação) — espelha `projetos_esg`
-- (migration 14), mas o dono é a concreteira, não uma obra: um item vale
-- para todas as construtoras que ela atende, não para uma obra específica.
--
-- Só item 'publicado' é visível para as construtoras vinculadas — rascunho
-- é espaço de trabalho da concreteira, igual rascunho de projeto ESG.

create table concreteira_esg (
  id uuid primary key default gen_random_uuid(),
  concreteira_id uuid not null references concreteiras (id),
  titulo text not null,
  descricao text not null,
  categoria text not null check (categoria in ('ambiental', 'social', 'governanca')),
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  criado_por uuid not null references perfis (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index concreteira_esg_concreteira_idx on concreteira_esg (concreteira_id);

create table concreteira_esg_documentos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references concreteira_esg (id) on delete cascade,
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  content_type text,
  enviado_por uuid not null references perfis (id),
  created_at timestamptz not null default now()
);
create index concreteira_esg_documentos_item_idx on concreteira_esg_documentos (item_id);

alter table concreteira_esg enable row level security;
alter table concreteira_esg_documentos enable row level security;

-- ---------- concreteira_esg ----------

create policy "concreteira_esg: concreteira vê os próprios" on concreteira_esg
  for select using (concreteira_id = current_concreteira_id() or is_admin());

create policy "concreteira_esg: construtora vê os publicados de quem vinculou" on concreteira_esg
  for select using (
    status = 'publicado' and construtora_vinculada_a_concreteira(concreteira_id)
  );

create policy "concreteira_esg: concreteira cria os próprios" on concreteira_esg
  for insert
  with check (
    concreteira_id = current_concreteira_id()
    and criado_por = auth.uid()
    and current_papel() = 'concreteira'
  );

create policy "concreteira_esg: concreteira edita os próprios" on concreteira_esg
  for update
  using (concreteira_id = current_concreteira_id() and current_papel() = 'concreteira')
  with check (concreteira_id = current_concreteira_id());

create policy "concreteira_esg: concreteira exclui rascunhos" on concreteira_esg
  for delete
  using (concreteira_id = current_concreteira_id() and status = 'rascunho');

-- ---------- concreteira_esg_documentos ----------

create policy "concreteira_esg_documentos: escopo do item" on concreteira_esg_documentos
  for select
  using (
    exists (
      select 1 from concreteira_esg
      where concreteira_esg.id = concreteira_esg_documentos.item_id
        and (
          concreteira_esg.concreteira_id = current_concreteira_id()
          or (concreteira_esg.status = 'publicado' and construtora_vinculada_a_concreteira(concreteira_esg.concreteira_id))
        )
    ) or is_admin()
  );

create policy "concreteira_esg_documentos: concreteira anexa nos próprios itens" on concreteira_esg_documentos
  for insert
  with check (
    enviado_por = auth.uid()
    and exists (
      select 1 from concreteira_esg
      where concreteira_esg.id = item_id and concreteira_esg.concreteira_id = current_concreteira_id()
    )
  );

create policy "concreteira_esg_documentos: concreteira remove dos próprios itens em rascunho" on concreteira_esg_documentos
  for delete
  using (
    exists (
      select 1 from concreteira_esg
      where concreteira_esg.id = concreteira_esg_documentos.item_id
        and concreteira_esg.concreteira_id = current_concreteira_id()
        and concreteira_esg.status = 'rascunho'
    )
  );

-- ---------- storage: documentos do scorecard ----------
-- Convenção de caminho: {concreteira_id}/{item_id}/{arquivo}

insert into storage.buckets (id, name, public)
values ('concreteira-esg-docs', 'concreteira-esg-docs', false)
on conflict (id) do nothing;

create policy "concreteira-esg-docs: concreteira lê os próprios arquivos" on storage.objects
  for select
  using (
    bucket_id = 'concreteira-esg-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
  );

create policy "concreteira-esg-docs: construtora lê os publicados de quem vinculou" on storage.objects
  for select
  using (
    bucket_id = 'concreteira-esg-docs'
    and exists (
      select 1 from concreteira_esg
      where concreteira_esg.concreteira_id::text = (storage.foldername(name))[1]
        and concreteira_esg.id::text = (storage.foldername(name))[2]
        and concreteira_esg.status = 'publicado'
        and construtora_vinculada_a_concreteira(concreteira_esg.concreteira_id)
    )
  );

create policy "concreteira-esg-docs: concreteira envia nos próprios arquivos" on storage.objects
  for insert
  with check (
    bucket_id = 'concreteira-esg-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
  );

create policy "concreteira-esg-docs: concreteira substitui os próprios arquivos" on storage.objects
  for update
  using (
    bucket_id = 'concreteira-esg-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
  )
  with check (
    bucket_id = 'concreteira-esg-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
  );

create policy "concreteira-esg-docs: concreteira remove os próprios arquivos" on storage.objects
  for delete
  using (
    bucket_id = 'concreteira-esg-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
  );
