-- CarbonFree Obras — schema núcleo (plano de negócio, seção 10)
-- Convenções: tabelas em snake_case plural; toda tabela de negócio tem
-- created_at/updated_at; RLS habilitado em tudo; nada de tributo lógico
-- embutido em nome de coluna — isso vive em municipios.regras (jsonb).

create extension if not exists "pgcrypto";

-- ============================================================
-- IDENTIDADE E TENANTS
-- ============================================================

-- Um tenant por município ou consórcio intermunicipal (CarbonFree Gov).
create table municipios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  uf char(2) not null,
  cnpj text unique,
  faixa_regua jsonb not null default '[]',        -- [{faixa, ate_kgco2e_m2, beneficio}]
  teto_compensacao_pct numeric(5,2) not null default 30.00,
  vigencia_inicio date not null default current_date,
  vigencia_fim date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Construtora ou profissional independente (tenant do CarbonFree Obra).
create table construtoras (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj_cpf text unique not null,
  tipo text not null check (tipo in ('pj', 'profissional_independente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Perfil de acesso — 1:1 com auth.users, define papel e tenant.
-- Segregação de funções (seção 5.3) é imposta aqui, não só na interface.
create table perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  papel text not null check (
    papel in (
      'prefeitura_analista',   -- mesa de análise; não homologa
      'prefeitura_gestor',     -- homologa selo, aplica sanção
      'construtora_lancador',  -- lança dados; não assina dossiê
      'construtora_rt',        -- responsável técnico; assina dossiê
      'fiscal',                -- só registra constatação em campo
      'admin_plataforma'
    )
  ),
  municipio_id uuid references municipios (id),
  construtora_id uuid references construtoras (id),
  created_at timestamptz not null default now(),
  constraint perfil_tenant_coerente check (
    (papel like 'prefeitura_%' and municipio_id is not null and construtora_id is null)
    or (papel like 'construtora_%' and construtora_id is not null and municipio_id is null)
    or (papel = 'fiscal' and municipio_id is not null and construtora_id is null)
    or (papel = 'admin_plataforma')
  )
);

-- ============================================================
-- OBRA E INVENTÁRIO
-- ============================================================

create table obras (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references municipios (id),
  construtora_id uuid not null references construtoras (id),
  alvara_numero text not null,
  inscricao_imobiliaria text,
  cno text,
  tipologia text not null,               -- residencial_vertical, comercial, etc.
  area_construida_m2 numeric(12,2) not null,
  coordenadas point,
  fase text not null default 'fundacao' check (
    fase in ('fundacao', 'estrutura', 'acabamento', 'entrega', 'concluida')
  ),
  limite_inventario jsonb not null default '{}', -- módulos EN 15978 declarados (A1-A5, B1, USO...)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (municipio_id, alvara_numero)
);
create index obras_municipio_idx on obras (municipio_id);
create index obras_construtora_idx on obras (construtora_id);

create table inventarios (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id),
  versao int not null,
  periodo_inicio date not null,
  periodo_fim date,
  status text not null default 'rascunho' check (
    status in ('rascunho', 'protocolado', 'em_analise', 'homologado', 'rejeitado')
  ),
  nivel_garantia smallint not null default 1 check (nivel_garantia between 1 and 4),
  hash_fechamento text,                  -- setado só quando homologado; congela o dossiê
  responsavel_tecnico_id uuid references perfis (id),
  homologado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (obra_id, versao)
);
create index inventarios_obra_idx on inventarios (obra_id);

-- Nunca sofre UPDATE — só nova versão. Recálculo determinístico depende disso.
create table fatores_emissao (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,               -- ex. 'cimento_cp2', 'aco_eaf', 'diesel_s10'
  valor numeric(14,6) not null,
  unidade text not null,                 -- tCO2e/t, kgCO2e/L, kgCO2e/m3...
  fonte text not null,                   -- DAP Brasil, MCTI, IPCC AR6...
  ano_base int not null,
  incerteza_pct numeric(5,2),
  vigencia_inicio date not null,
  vigencia_fim date,
  created_at timestamptz not null default now()
);
create index fatores_categoria_vigencia_idx on fatores_emissao (categoria, vigencia_inicio, vigencia_fim);

create table evidencias (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id),
  tipo text not null check (tipo in ('nfe', 'cte', 'mtr', 'cdf', 'fatura_energia', 'laudo', 'certificado', 'outro')),
  chave_acesso text,                     -- chave de 44 dígitos NF-e/CT-e quando aplicável
  cnpj_emitente text,
  hash_sha256 text not null,
  storage_path text not null,
  status_validacao text not null default 'pendente' check (
    status_validacao in ('pendente', 'validado', 'rejeitado')
  ),
  resultado_consulta_externa jsonb,
  created_at timestamptz not null default now(),
  unique (obra_id, chave_acesso)
);
create index evidencias_obra_idx on evidencias (obra_id);

create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references inventarios (id),
  modulo_en15978 text not null,          -- A1-A3, A4, A5, USO, B1...
  natureza text not null check (natureza in ('ativo', 'passivo')),
  item text not null,
  quantidade numeric(16,4) not null,
  unidade text not null,
  fator_id uuid references fatores_emissao (id),
  tco2e numeric(14,4) not null,
  incerteza_pct numeric(5,2),
  evidencia_id uuid references evidencias (id),
  created_at timestamptz not null default now(),
  -- lançamento órfão é bloqueado: toda linha aponta para evidência
  constraint lancamento_tem_evidencia check (evidencia_id is not null)
);
create index lancamentos_inventario_idx on lancamentos (inventario_id);

create table acoes_remocao (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid not null references lancamentos (id),
  tipo text not null,                    -- SUB, RCC, ENE, ARB, CRV, MAD, EFI, AGU
  linha_base text not null,              -- referência obrigatória — sem isso não entra no ativo
  adicionalidade text not null,
  tco2e_reconhecido numeric(14,4) not null,
  condicionantes jsonb default '[]',
  parcela_liberada_pct numeric(5,2) not null default 100.00,
  created_at timestamptz not null default now()
);

create table mudas (
  id uuid primary key default gen_random_uuid(),
  acao_remocao_id uuid not null references acoes_remocao (id),
  especie text not null,
  coordenadas point not null,
  data_plantio date not null,
  checkpoints jsonb not null default '[]', -- [{mes: 12|24|36, sobreviveu: bool, foto_id, data}]
  created_at timestamptz not null default now()
);

create table creditos_retirados (
  id uuid primary key default gen_random_uuid(),
  acao_remocao_id uuid not null references acoes_remocao (id),
  registro text not null,                -- nome do registro público (Verra, Gold Standard, etc.)
  serial text not null,
  safra text,
  projeto text not null,
  tco2e numeric(14,4) not null,
  titular_aposentadoria text not null,
  created_at timestamptz not null default now(),
  -- impede dupla contagem do mesmo crédito em qualquer obra do sistema
  unique (registro, serial)
);

-- ============================================================
-- FISCALIZAÇÃO
-- ============================================================

create table fiscalizacoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id),
  fiscal_id uuid not null references perfis (id),
  agendado_para timestamptz,
  checklist_aplicado jsonb not null default '[]',
  constatacoes jsonb not null default '[]',
  midias jsonb not null default '[]',     -- [{storage_path, hash_sha256, geotag, capturado_em}]
  coordenada_execucao point,
  status text not null default 'agendada' check (
    status in ('agendada', 'em_campo', 'concluida', 'cancelada')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fiscalizacoes_obra_idx on fiscalizacoes (obra_id);
create index fiscalizacoes_fiscal_idx on fiscalizacoes (fiscal_id);

create table autos (
  id uuid primary key default gen_random_uuid(),
  fiscalizacao_id uuid not null references fiscalizacoes (id),
  tipo text not null check (tipo in ('constatacao', 'infracao')),
  enquadramento_legal text,
  prazo_defesa date,
  tramitacao text not null default 'aberto' check (
    tramitacao in ('aberto', 'em_defesa', 'julgado', 'arquivado')
  ),
  sancao jsonb,
  tac_vinculado_id uuid,
  assinado_por uuid references perfis (id),
  assinado_em timestamptz,
  created_at timestamptz not null default now()
);

create table selos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id),
  inventario_id uuid not null references inventarios (id),
  nivel text not null,                   -- AAA, AA, A, B, C
  faixa_atingida_kgco2e_m2 numeric(10,2) not null,
  beneficio_concedido jsonb default '[]',
  validade date,
  condicionantes jsonb default '[]',
  revogado_em timestamptz,
  motivo_revogacao text,
  created_at timestamptz not null default now()
);
create index selos_obra_idx on selos (obra_id);

-- ============================================================
-- TRILHA DE AUDITORIA — append-only
-- ============================================================

create table trilha_auditoria (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid references perfis (id),
  acao text not null,
  entidade text not null,
  entidade_id uuid not null,
  diff jsonb,
  ip inet,
  criado_em timestamptz not null default now()
);
create index trilha_entidade_idx on trilha_auditoria (entidade, entidade_id);

create or replace function bloquear_update_delete()
returns trigger as $$
begin
  raise exception '% é append-only: UPDATE e DELETE não são permitidos', tg_table_name;
end;
$$ language plpgsql;

create trigger trilha_bloqueia_update
  before update or delete on trilha_auditoria
  for each row execute function bloquear_update_delete();

create trigger fatores_bloqueia_update
  before update or delete on fatores_emissao
  for each row execute function bloquear_update_delete();
