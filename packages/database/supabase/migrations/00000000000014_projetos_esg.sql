-- Módulo ESG da construtora (CarbonFree Obra): construtora envia projetos
-- ESG (ambiental/social/governança) com documentação anexa; a prefeitura
-- acompanha e decide o status, que serve de base para o processo de
-- desconto fiscal — decidido manualmente no Gov, não calculado aqui.

create table projetos_esg (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id),
  construtora_id uuid not null references construtoras (id),
  titulo text not null,
  descricao text not null,
  categoria text not null check (categoria in ('ambiental', 'social', 'governanca')),
  status text not null default 'rascunho' check (
    status in ('rascunho', 'enviado', 'em_analise', 'aprovado', 'rejeitado')
  ),
  enviado_em timestamptz,
  decidido_em timestamptz,
  motivo_decisao text,
  criado_por uuid not null references perfis (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projetos_esg_obra_idx on projetos_esg (obra_id);
create index projetos_esg_construtora_idx on projetos_esg (construtora_id);

create table projeto_esg_documentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos_esg (id) on delete cascade,
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  content_type text,
  enviado_por uuid not null references perfis (id),
  created_at timestamptz not null default now()
);
create index projeto_esg_documentos_projeto_idx on projeto_esg_documentos (projeto_id);

alter table projetos_esg enable row level security;
alter table projeto_esg_documentos enable row level security;

-- ---------- projetos_esg ----------

create policy "projetos_esg: construtora vê os próprios" on projetos_esg
  for select using (construtora_id = current_construtora_id() or is_admin());

create policy "projetos_esg: prefeitura vê os da obra no município" on projetos_esg
  for select using (
    exists (
      select 1 from obras
      where obras.id = projetos_esg.obra_id and obras.municipio_id = current_municipio_id()
    )
  );

create policy "projetos_esg: construtora cria nas próprias obras" on projetos_esg
  for insert
  with check (
    construtora_id = current_construtora_id()
    and criado_por = auth.uid()
    and current_papel() in ('construtora_lancador', 'construtora_rt')
    and exists (
      select 1 from obras
      where obras.id = obra_id and obras.construtora_id = current_construtora_id()
    )
  );

create policy "projetos_esg: construtora edita os próprios enquanto em rascunho ou enviado" on projetos_esg
  for update
  using (
    construtora_id = current_construtora_id()
    and current_papel() in ('construtora_lancador', 'construtora_rt')
  )
  with check (
    construtora_id = current_construtora_id()
    and status in ('rascunho', 'enviado')
  );

create policy "projetos_esg: prefeitura decide o status" on projetos_esg
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from obras
      where obras.id = projetos_esg.obra_id and obras.municipio_id = current_municipio_id()
    )
  )
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from obras
      where obras.id = projetos_esg.obra_id and obras.municipio_id = current_municipio_id()
    )
  );

create policy "projetos_esg: construtora exclui rascunhos" on projetos_esg
  for delete
  using (
    construtora_id = current_construtora_id()
    and status = 'rascunho'
  );

-- ---------- projeto_esg_documentos ----------

create policy "projeto_esg_documentos: escopo do projeto" on projeto_esg_documentos
  for select
  using (
    exists (
      select 1 from projetos_esg
      where projetos_esg.id = projeto_esg_documentos.projeto_id
        and (
          projetos_esg.construtora_id = current_construtora_id()
          or exists (
            select 1 from obras
            where obras.id = projetos_esg.obra_id and obras.municipio_id = current_municipio_id()
          )
        )
    ) or is_admin()
  );

create policy "projeto_esg_documentos: construtora anexa nos próprios projetos" on projeto_esg_documentos
  for insert
  with check (
    enviado_por = auth.uid()
    and exists (
      select 1 from projetos_esg
      where projetos_esg.id = projeto_id
        and projetos_esg.construtora_id = current_construtora_id()
        and projetos_esg.status in ('rascunho', 'enviado')
    )
  );

create policy "projeto_esg_documentos: construtora remove dos próprios projetos em rascunho" on projeto_esg_documentos
  for delete
  using (
    exists (
      select 1 from projetos_esg
      where projetos_esg.id = projeto_esg_documentos.projeto_id
        and projetos_esg.construtora_id = current_construtora_id()
        and projetos_esg.status = 'rascunho'
    )
  );

-- ---------- storage: documentos ESG ----------
-- Convenção de caminho: {construtora_id}/{projeto_id}/{arquivo}

insert into storage.buckets (id, name, public)
values ('projetos-esg-docs', 'projetos-esg-docs', false)
on conflict (id) do nothing;

create policy "projetos-esg-docs: construtora lê os próprios arquivos" on storage.objects
  for select
  using (
    bucket_id = 'projetos-esg-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

create policy "projetos-esg-docs: prefeitura lê arquivos de obras do município" on storage.objects
  for select
  using (
    bucket_id = 'projetos-esg-docs'
    and exists (
      select 1 from projetos_esg
      join obras on obras.id = projetos_esg.obra_id
      where projetos_esg.construtora_id::text = (storage.foldername(name))[1]
        and projetos_esg.id::text = (storage.foldername(name))[2]
        and obras.municipio_id = current_municipio_id()
    )
  );

create policy "projetos-esg-docs: construtora envia nos próprios arquivos" on storage.objects
  for insert
  with check (
    bucket_id = 'projetos-esg-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

create policy "projetos-esg-docs: construtora substitui os próprios arquivos" on storage.objects
  for update
  using (
    bucket_id = 'projetos-esg-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  )
  with check (
    bucket_id = 'projetos-esg-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );

create policy "projetos-esg-docs: construtora remove os próprios arquivos" on storage.objects
  for delete
  using (
    bucket_id = 'projetos-esg-docs'
    and (storage.foldername(name))[1] = current_construtora_id()::text
  );
