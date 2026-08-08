-- Plano de ação documental por rota de captação.
--
-- A matriz documental (25 documentos × 3 rotas, com prioridade e responsável
-- sugerido) vive no código junto do diagnóstico — é metodologia versionada.
-- Aqui fica só o acompanhamento por projeto: em que pé está cada documento e,
-- quando existe, o arquivo.
--
-- Um documento pode estar pronto sem arquivo anexado (uma lei publicada, uma
-- CAPAG consultada no Tesouro), então o anexo é opcional e a situação é o que
-- move o indicador.

create table projeto_documentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos_captacao (id) on delete cascade,
  -- id do documento na matriz de referência (1 a 25)
  documento_id int not null check (documento_id between 1 and 25),
  situacao text not null default 'pendente' check (
    situacao in ('pendente', 'em_elaboracao', 'pronto', 'nao_aplicavel')
  ),
  observacao text,
  -- anexo opcional
  nome_arquivo text,
  storage_path text,
  tamanho_bytes bigint,
  content_type text,
  atualizado_por uuid references perfis (id),
  updated_at timestamptz not null default now(),
  unique (projeto_id, documento_id),
  -- ou tem os dois campos do anexo, ou nenhum
  constraint projeto_documentos_anexo_completo check (
    (nome_arquivo is null) = (storage_path is null)
  )
);
create index projeto_documentos_projeto_idx on projeto_documentos (projeto_id);

alter table projeto_documentos enable row level security;

create policy "projeto_documentos: prefeitura vê os do município" on projeto_documentos
  for select
  using (
    exists (
      select 1 from projetos_captacao p
      where p.id = projeto_documentos.projeto_id
        and p.municipio_id = current_municipio_id()
    )
    or is_admin()
  );

create policy "projeto_documentos: prefeitura registra" on projeto_documentos
  for insert
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from projetos_captacao p
      where p.id = projeto_id and p.municipio_id = current_municipio_id()
    )
  );

create policy "projeto_documentos: prefeitura atualiza" on projeto_documentos
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from projetos_captacao p
      where p.id = projeto_documentos.projeto_id
        and p.municipio_id = current_municipio_id()
    )
  )
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from projetos_captacao p
      where p.id = projeto_id and p.municipio_id = current_municipio_id()
    )
  );

create policy "projeto_documentos: prefeitura remove" on projeto_documentos
  for delete
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from projetos_captacao p
      where p.id = projeto_documentos.projeto_id
        and p.municipio_id = current_municipio_id()
    )
  );

-- ---------- storage ----------
-- Convenção de caminho: {municipio_id}/{projeto_id}/{arquivo}
-- O município é o primeiro segmento porque é o escopo que as políticas
-- conseguem checar sem consultar outra tabela a cada objeto.

insert into storage.buckets (id, name, public)
values ('captacao-docs', 'captacao-docs', false)
on conflict (id) do nothing;

create policy "captacao-docs: prefeitura lê os do município" on storage.objects
  for select
  using (
    bucket_id = 'captacao-docs'
    and (storage.foldername(name))[1] = current_municipio_id()::text
  );

create policy "captacao-docs: prefeitura envia no próprio município" on storage.objects
  for insert
  with check (
    bucket_id = 'captacao-docs'
    and (storage.foldername(name))[1] = current_municipio_id()::text
    and current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
  );

-- Substituir um documento é o caso comum (v2 do estudo, orçamento revisado),
-- e upsert no storage precisa de update além de insert e select.
create policy "captacao-docs: prefeitura substitui os do município" on storage.objects
  for update
  using (
    bucket_id = 'captacao-docs'
    and (storage.foldername(name))[1] = current_municipio_id()::text
    and current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
  )
  with check (
    bucket_id = 'captacao-docs'
    and (storage.foldername(name))[1] = current_municipio_id()::text
    and current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
  );

create policy "captacao-docs: prefeitura remove os do município" on storage.objects
  for delete
  using (
    bucket_id = 'captacao-docs'
    and (storage.foldername(name))[1] = current_municipio_id()::text
    and current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
  );
