-- Certificação municipal de sustentabilidade — acompanhamento pela construtora.
--
-- Motivação: o programa de Porto Alegre (LC nº 872/2020 + Decreto nº
-- 21.789/2022) não cabe na `municipios.faixa_regua`. A régua é de eixo único
-- (intensidade em kgCO₂e/m² → faixa → benefício); o programa pontua SETE
-- dimensões independentes e o selo sai da CONTAGEM de dimensões que bateram o
-- mínimo próprio de cada uma. São dois eixos paralelos, e este é o segundo.
--
-- O CATÁLOGO NÃO ESTÁ AQUI. As dimensões, os critérios, os pontos e os níveis
-- vivem em `apps/obra/src/lib/certificacao-poa.ts`, pela mesma razão de
-- `roteiros-ativo.ts`: é norma versionada, muda por revisão de decreto, não por
-- operação do usuário. Por isso `certificacao_itens.criterio_codigo` é texto
-- sem FK — a referência é para o catálogo em código, e um critério que o
-- decreto revogue não deve apagar o histórico de quem já pontuou por ele.
--
-- O QUE JUSTIFICA PERSISTIR
-- A simulação do quadro de pontuação não precisaria de tabela. O que precisa é
-- o que continua depois do protocolo: os dois trâmites separados (a SMAMUS
-- emite o certificado, a SMF concede o benefício fiscal em pedido próprio), a
-- validade de 3 anos, a renovação da IN SMAMUS nº 001/2026 e o vínculo
-- documento ↔ critério com data de validade — que é o que sustenta a obra
-- numa vistoria por amostragem (art. 14).

create table certificacoes_municipais (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id) on delete cascade,
  construtora_id uuid not null references construtoras (id),

  -- Identifica de qual programa municipal é este pedido. Hoje só Porto Alegre
  -- tem catálogo escrito; a coluna existe para o próximo município não exigir
  -- migration de estrutura.
  programa text not null default 'poa_sustentabilidade_ambiental',

  -- Os dois status são separados de propósito. Certificado aprovado com
  -- benefício não solicitado é o estado que faz a construtora perder o
  -- desconto sem perceber, e ele precisa ser visível.
  status_certificacao text not null default 'nao_iniciada' check (
    status_certificacao in (
      'nao_iniciada', 'em_preparacao', 'protocolada',
      'em_analise', 'aprovada', 'indeferida', 'cancelada'
    )
  ),
  status_beneficio_fiscal text not null default 'nao_solicitado' check (
    status_beneficio_fiscal in ('nao_solicitado', 'solicitado', 'deferido', 'indeferido')
  ),

  protocolo text,
  nivel_pretendido text check (nivel_pretendido in ('bronze', 'prata', 'ouro', 'diamante')),
  nivel_obtido text check (nivel_obtido in ('bronze', 'prata', 'ouro', 'diamante')),

  protocolada_em date,
  emitido_em date,
  -- 3 anos da emissão. Guardada em coluna, e não derivada, porque prorrogação
  -- ou indeferimento parcial podem deslocá-la.
  validade date,

  -- Renovação da IN SMAMUS nº 001/2026: mantém a categoria e vale por mais 3
  -- anos. Aponta para a certificação anterior em vez de sobrescrevê-la — o
  -- histórico é o que prova continuidade das ações na vistoria.
  renovacao_de uuid references certificacoes_municipais (id),

  -- O desconto de IPTU exige prévia emissão da Carta de Habitação. Obra em
  -- construção pode certificar e ganhar altura, mas não descontar.
  carta_habitacao_emitida boolean not null default false,

  -- Exercício em que o desconto começa, pela regra do Decreto nº 23.226/2025
  -- (pedido até 31/08 → exercício seguinte; de 01/09 em diante → o segundo).
  exercicio_beneficio integer,

  -- Entradas da estimativa financeira, para o número não se perder entre
  -- sessões. Teto legal, não valor a receber.
  iptu_anual_referencia numeric(14, 2) check (iptu_anual_referencia >= 0),
  altura_basica_m numeric(8, 2) check (altura_basica_m >= 0),

  observacoes text,
  criado_por uuid not null references perfis (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Cancelamento por descaracterização (art. 14) precisa de motivo registrado.
  constraint certificacao_cancelada_tem_motivo check (
    status_certificacao <> 'cancelada' or observacoes is not null
  )
);
create index certificacoes_municipais_obra_idx on certificacoes_municipais (obra_id);
create index certificacoes_municipais_construtora_idx on certificacoes_municipais (construtora_id);
create index certificacoes_municipais_renovacao_idx on certificacoes_municipais (renovacao_de);
create index certificacoes_municipais_criado_por_idx on certificacoes_municipais (criado_por);

-- Uma linha por critério pontuado, na forma que o próprio material da
-- prefeitura sugere: critério, pontos, documento, responsável, anexado?,
-- validado?, validade.
create table certificacao_itens (
  id uuid primary key default gen_random_uuid(),
  certificacao_id uuid not null references certificacoes_municipais (id) on delete cascade,
  dimensao text not null check (dimensao in ('BIO', 'CLI', 'AGU', 'ENE', 'RES', 'MAT', 'MOB')),
  criterio_codigo text not null,

  pontos numeric(6, 2) not null default 0 check (pontos >= 0),
  -- Condição escolhida quando o critério pontua por escala (telhado verde a
  -- 50% ou 75%, economia de água a 20/35/40%…). Nulo quando é ponto fixo ou
  -- valor lido do Anexo I.
  faixa text,

  documento_anexado boolean not null default false,
  validado boolean not null default false,
  validade_documento date,
  responsavel text,
  observacao text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (certificacao_id, criterio_codigo)
);
create index certificacao_itens_certificacao_idx on certificacao_itens (certificacao_id);

alter table certificacoes_municipais enable row level security;
alter table certificacao_itens enable row level security;

-- ---------- certificacoes_municipais ----------

create policy "certificacoes_municipais: construtora vê as próprias" on certificacoes_municipais
  for select using (construtora_id = current_construtora_id() or is_admin());

create policy "certificacoes_municipais: prefeitura vê as das obras do município" on certificacoes_municipais
  for select using (
    exists (
      select 1 from obras
      where obras.id = certificacoes_municipais.obra_id
        and obras.municipio_id = current_municipio_id()
    )
  );

create policy "certificacoes_municipais: construtora cria nas próprias obras" on certificacoes_municipais
  for insert
  with check (
    construtora_id = current_construtora_id()
    and criado_por = (select auth.uid())
    and current_papel() in ('construtora_lancador', 'construtora_rt')
    and exists (
      select 1 from obras
      where obras.id = obra_id and obras.construtora_id = current_construtora_id()
    )
  );

-- A construtora acompanha um processo que corre FORA do sistema (Portal de
-- Licenciamento, SMAMUS, SMF). Ela é quem registra o andamento, então edita a
-- própria certificação — inclusive os status, que aqui são espelho do trâmite
-- externo, não decisão tomada na plataforma.
create policy "certificacoes_municipais: construtora edita as próprias" on certificacoes_municipais
  for update
  using (
    construtora_id = current_construtora_id()
    and current_papel() in ('construtora_lancador', 'construtora_rt')
  )
  with check (construtora_id = current_construtora_id());

create policy "certificacoes_municipais: construtora exclui as não protocoladas" on certificacoes_municipais
  for delete
  using (
    construtora_id = current_construtora_id()
    and status_certificacao in ('nao_iniciada', 'em_preparacao')
  );

-- ---------- certificacao_itens ----------

create policy "certificacao_itens: escopo da certificação" on certificacao_itens
  for select
  using (
    exists (
      select 1 from certificacoes_municipais c
      where c.id = certificacao_itens.certificacao_id
        and (
          c.construtora_id = current_construtora_id()
          or exists (
            select 1 from obras
            where obras.id = c.obra_id and obras.municipio_id = current_municipio_id()
          )
        )
    ) or is_admin()
  );

create policy "certificacao_itens: construtora preenche as próprias" on certificacao_itens
  for insert
  with check (
    exists (
      select 1 from certificacoes_municipais c
      where c.id = certificacao_id
        and c.construtora_id = current_construtora_id()
        and current_papel() in ('construtora_lancador', 'construtora_rt')
    )
  );

create policy "certificacao_itens: construtora edita as próprias" on certificacao_itens
  for update
  using (
    exists (
      select 1 from certificacoes_municipais c
      where c.id = certificacao_itens.certificacao_id
        and c.construtora_id = current_construtora_id()
        and current_papel() in ('construtora_lancador', 'construtora_rt')
    )
  )
  with check (
    exists (
      select 1 from certificacoes_municipais c
      where c.id = certificacao_itens.certificacao_id
        and c.construtora_id = current_construtora_id()
    )
  );

create policy "certificacao_itens: construtora remove as próprias" on certificacao_itens
  for delete
  using (
    exists (
      select 1 from certificacoes_municipais c
      where c.id = certificacao_itens.certificacao_id
        and c.construtora_id = current_construtora_id()
        and current_papel() in ('construtora_lancador', 'construtora_rt')
    )
  );
