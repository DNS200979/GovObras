-- Documentos que a prefeitura exige no cadastro da obra (alvará, projeto
-- aprovado, ART/RRT, licença ambiental, matrícula…) enviados pela própria
-- construtora. Separado de `evidencias`, que é prova de lançamento de
-- inventário e tem outro ciclo de validação.

create table obra_documentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id) on delete cascade,
  tipo text not null check (
    tipo in (
      'alvara',
      'projeto_aprovado',
      'art_rrt',
      'licenca_ambiental',
      'matricula',
      'cno',
      'outro'
    )
  ),
  descricao text,
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  content_type text,
  enviado_por uuid not null references perfis (id),
  created_at timestamptz not null default now()
);
create index obra_documentos_obra_idx on obra_documentos (obra_id);

alter table obra_documentos enable row level security;

create policy "obra_documentos: construtora vê os das próprias obras" on obra_documentos
  for select
  using (
    exists (
      select 1 from obras
      where obras.id = obra_documentos.obra_id
        and obras.construtora_id = current_construtora_id()
    )
    or is_admin()
  );

create policy "obra_documentos: prefeitura vê os das obras do município" on obra_documentos
  for select
  using (
    exists (
      select 1 from obras
      where obras.id = obra_documentos.obra_id
        and obras.municipio_id = current_municipio_id()
    )
  );

create policy "obra_documentos: construtora anexa nas próprias obras" on obra_documentos
  for insert
  with check (
    enviado_por = auth.uid()
    and exists (
      select 1 from obras
      where obras.id = obra_id and obras.construtora_id = current_construtora_id()
    )
  );

create policy "obra_documentos: construtora remove os das próprias obras" on obra_documentos
  for delete
  using (
    exists (
      select 1 from obras
      where obras.id = obra_documentos.obra_id
        and obras.construtora_id = current_construtora_id()
    )
  );

-- ---------- storage ----------
-- Convenção de caminho: {construtora_id}/{obra_id}/{arquivo}

insert into storage.buckets (id, name, public)
values ('obra-docs', 'obra-docs', false)
on conflict (id) do nothing;

create policy "obra-docs: construtora lê os próprios arquivos" on storage.objects
  for select
  using (
    bucket_id = 'obra-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

create policy "obra-docs: prefeitura lê arquivos de obras do município" on storage.objects
  for select
  using (
    bucket_id = 'obra-docs'
    and exists (
      select 1 from obras
      where obras.id::text = (storage.foldername(name))[2]
        and obras.municipio_id = current_municipio_id()
    )
  );

create policy "obra-docs: construtora envia nos próprios arquivos" on storage.objects
  for insert
  with check (
    bucket_id = 'obra-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

create policy "obra-docs: construtora substitui os próprios arquivos" on storage.objects
  for update
  using (
    bucket_id = 'obra-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  )
  with check (
    bucket_id = 'obra-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

create policy "obra-docs: construtora remove os próprios arquivos" on storage.objects
  for delete
  using (
    bucket_id = 'obra-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

-- ---------- municípios ----------
-- Para cadastrar uma obra a construtora precisa escolher o município, o que
-- exige enxergar a lista antes de ter qualquer obra lá. A tabela guarda regra
-- pública do programa (régua de faixas, teto de compensação), não dado
-- sensível de terceiros.

create policy "municipios: leitura autenticada" on municipios
  for select to authenticated using (true);
