-- Campos exigidos pelo SisobraPref (Receita Federal), que a prefeitura é
-- obrigada a informar até o dia 10 de cada mês sobre os alvarás emitidos no
-- mês anterior — ou uma declaração de sem movimento, se não houve nenhum.
-- Leiaute conforme "Manual Web Service SisobraPref" (schemas v1.03).
--
-- O cadastro atual só guardava número do alvará, área e coordenada; nada
-- disso basta para montar o XML.

alter table obras
  -- datas e tipo do alvará
  add column data_alvara date,
  add column data_inicio_obra date,
  add column data_final_obra date,
  add column tipo_alvara text check (tipo_alvara in ('inicial', 'retificado')),

  -- quem responde pela execução (leiaute 8)
  add column responsavel_exec_obra text check (
    responsavel_exec_obra in (
      'proprietario_do_imovel',
      'dono_da_obra',
      'incorporador_construcao_civil',
      'empresa_construtora',
      'empresa_lider_consorcio',
      'consorcio',
      'construcao_nome_coletivo'
    )
  ),

  -- endereço da obra (leiaute 9) — a Receita exige endereço postal,
  -- a coordenada geográfica não substitui
  add column cep text,
  add column tipo_logradouro text,
  add column logradouro text,
  add column numero_imovel text,
  add column complemento text,
  add column bairro text,

  -- área principal (leiaute 12.1)
  add column area_categoria text check (
    area_categoria in ('obra_nova', 'acrescimo', 'reforma', 'demolicao', 'existente')
  ),
  add column area_destinacao text check (
    area_destinacao in (
      'residencial_unifamiliar',
      'residencial_multifamiliar',
      'comercial_salas_lojas',
      'edificio_garagens',
      'galpao_industrial',
      'casa_popular',
      'conjunto_habitacional_popular'
    )
  ),
  add column area_tipo_obra text check (area_tipo_obra in ('alvenaria', 'madeira', 'mista')),

  -- responsável técnico (leiaute 14.4): um profissional, com o registro e o
  -- documento do conselho correspondente (CREA/ART ou CAU/RRT)
  add column resp_tecnico_tipo text check (
    resp_tecnico_tipo in ('engenheiro', 'arquiteto', 'tecnologo', 'tecnico_industrial')
  ),
  add column resp_tecnico_nome text,
  add column resp_tecnico_registro text,
  add column resp_tecnico_documento text;

comment on column obras.resp_tecnico_registro is 'Número no conselho: CREA (engenheiro) ou CAU (arquiteto)';
comment on column obras.resp_tecnico_documento is 'Documento do conselho: ART (CREA) ou RRT (CAU)';

-- ============================================================
-- Controle mensal do envio
-- ============================================================

create table sisobra_envios (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references municipios (id),
  -- competência guardada no 1º dia do mês de referência
  competencia date not null,
  tipo text not null check (tipo in ('lote', 'sem_movimento')),
  status text not null default 'pendente' check (
    status in ('pendente', 'transmitido', 'erro')
  ),
  protocolo text,
  mensagem_erro text,
  total_alvaras int not null default 0,
  transmitido_em timestamptz,
  registrado_por uuid references perfis (id),
  created_at timestamptz not null default now(),
  unique (municipio_id, competencia)
);
create index sisobra_envios_municipio_idx on sisobra_envios (municipio_id, competencia desc);

alter table sisobra_envios enable row level security;

create policy "sisobra_envios: prefeitura vê os do próprio município" on sisobra_envios
  for select using (municipio_id = current_municipio_id() or is_admin());

create policy "sisobra_envios: prefeitura registra os do próprio município" on sisobra_envios
  for insert
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  );

create policy "sisobra_envios: prefeitura atualiza os do próprio município" on sisobra_envios
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  )
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  );

-- CNPJ do município: obrigatório no XML (identifica o emissor do lote).
-- A coluna já existe em `municipios`, mas estava sem valor no seed.
