-- Captação de recursos climáticos internacionais.
--
-- Baseado na "Matriz de Financiamento Climático Municipal": cada iniciativa
-- que a prefeitura quer financiar vira um projeto de captação, e cada projeto
-- responde ao diagnóstico de prontidão (20 questões com peso, 99 pontos).
-- A pontuação define a rota de captação e os canais recomendados.
--
-- A matriz de questões vive no código (é metodologia versionada, não dado do
-- usuário); aqui ficam só os projetos e as respostas.

create table projetos_captacao (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references municipios (id),
  nome text not null,
  descricao text not null,
  tema text not null check (
    tema in (
      'adaptacao_resiliencia',
      'mobilidade',
      'saneamento_agua',
      'residuos',
      'energia',
      'drenagem',
      'florestas_bioeconomia',
      'infraestrutura_urbana'
    )
  ),
  valor_estimado_brl numeric(16,2),
  situacao text not null default 'diagnostico' check (
    situacao in ('diagnostico', 'preparacao', 'negociacao', 'contratado', 'arquivado')
  ),
  criado_por uuid not null references perfis (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projetos_captacao_municipio_idx on projetos_captacao (municipio_id);

create table diagnostico_respostas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos_captacao (id) on delete cascade,
  -- id da questão na matriz de referência (1 a 20)
  questao_id int not null check (questao_id between 1 and 20),
  resposta text not null check (resposta in ('sim', 'parcial', 'nao')),
  evidencia text,
  -- 'automatico' = deduzido de dado que a plataforma já tem; a prefeitura
  -- pode sobrescrever, e aí passa a 'manual'
  origem text not null default 'manual' check (origem in ('manual', 'automatico')),
  respondido_por uuid references perfis (id),
  updated_at timestamptz not null default now(),
  unique (projeto_id, questao_id)
);
create index diagnostico_respostas_projeto_idx on diagnostico_respostas (projeto_id);

alter table projetos_captacao enable row level security;
alter table diagnostico_respostas enable row level security;

-- ---------- projetos_captacao ----------

create policy "projetos_captacao: prefeitura vê os do município" on projetos_captacao
  for select using (municipio_id = current_municipio_id() or is_admin());

create policy "projetos_captacao: prefeitura cria no próprio município" on projetos_captacao
  for insert
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
    and criado_por = auth.uid()
  );

create policy "projetos_captacao: prefeitura edita os do município" on projetos_captacao
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  )
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  );

create policy "projetos_captacao: gestor exclui os do município" on projetos_captacao
  for delete
  using (current_papel() = 'prefeitura_gestor' and municipio_id = current_municipio_id());

-- ---------- diagnostico_respostas ----------

create policy "diagnostico_respostas: escopo do projeto" on diagnostico_respostas
  for select
  using (
    exists (
      select 1 from projetos_captacao p
      where p.id = diagnostico_respostas.projeto_id
        and p.municipio_id = current_municipio_id()
    )
    or is_admin()
  );

create policy "diagnostico_respostas: prefeitura responde" on diagnostico_respostas
  for insert
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from projetos_captacao p
      where p.id = projeto_id and p.municipio_id = current_municipio_id()
    )
  );

create policy "diagnostico_respostas: prefeitura atualiza" on diagnostico_respostas
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from projetos_captacao p
      where p.id = diagnostico_respostas.projeto_id
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
