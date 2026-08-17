-- Rastreabilidade de mistura: o que a concreteira somou ao cimento "limpo"
-- em cada entrega de concreto na obra. É dado declarado pela concreteira,
-- por carga — a materialização em `lancamentos` do inventário de carbono
-- (cálculo de tCO2e e lançamento no módulo A3/A4) fica para uma fase
-- seguinte, de propósito: aqui só se registra o que foi declarado.

create table entregas_concreto (
  id uuid primary key default gen_random_uuid(),
  obra_concreteira_id uuid not null references obra_concreteiras (id),
  -- denormalizados: é o que as políticas de RLS checam sem precisar de um
  -- join extra a cada linha (mesmo raciocínio de `obra_id`/`concreteira_id`
  -- em `entregas_concreto` espelhando `evidencias.obra_id`).
  obra_id uuid not null references obras (id),
  concreteira_id uuid not null references concreteiras (id),
  volume_m3 numeric(12,3) not null,
  traco text,
  data_entrega date not null,
  evidencia_id uuid references evidencias (id),
  status text not null default 'declarada' check (status in ('declarada', 'validada', 'contestada')),
  criado_por uuid not null references perfis (id),
  created_at timestamptz not null default now()
);
create index entregas_concreto_obra_idx on entregas_concreto (obra_id);
create index entregas_concreto_concreteira_idx on entregas_concreto (concreteira_id);

create table entrega_composicao (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references entregas_concreto (id) on delete cascade,
  -- vocabulário livre, mesmo espírito de fatores_emissao.categoria
  -- (ex.: 'cimento_cp2', 'brita_1', 'aditivo_plastificante', 'cinza_volante')
  insumo text not null,
  quantidade numeric(14,4) not null,
  unidade text not null,
  fator_id uuid references fatores_emissao (id),
  created_at timestamptz not null default now()
);
create index entrega_composicao_entrega_idx on entrega_composicao (entrega_id);

alter table entregas_concreto enable row level security;
alter table entrega_composicao enable row level security;

-- ---------- entregas_concreto ----------

create policy "entregas_concreto: concreteira vê as próprias" on entregas_concreto
  for select using (concreteira_id = current_concreteira_id() or is_admin());

create policy "entregas_concreto: construtora vê as da própria obra" on entregas_concreto
  for select using (
    exists (select 1 from obras where obras.id = entregas_concreto.obra_id and obras.construtora_id = current_construtora_id())
  );

create policy "entregas_concreto: concreteira declara nos próprios vínculos" on entregas_concreto
  for insert
  with check (
    criado_por = auth.uid()
    and concreteira_id = current_concreteira_id()
    and current_papel() = 'concreteira'
    and exists (
      select 1 from obra_concreteiras oc
      where oc.id = obra_concreteira_id
        and oc.concreteira_id = current_concreteira_id()
        and oc.obra_id = obra_id
        and oc.status = 'ativo'
    )
  );

-- Enquanto 'declarada', a concreteira ainda pode corrigir a própria entrega
-- (volume errado, traço incompleto); uma vez validada ou contestada pela
-- construtora, a declaração original fica congelada.
-- `with check` também trava o status em 'declarada': sem isso a concreteira
-- poderia usar esta mesma política pra pular direto pra 'validada', que é
-- prerrogativa da construtora na política seguinte.
create policy "entregas_concreto: concreteira corrige enquanto declarada" on entregas_concreto
  for update
  using (concreteira_id = current_concreteira_id() and status = 'declarada')
  with check (concreteira_id = current_concreteira_id() and status = 'declarada');

-- O `with check` repete a condição de posse do `using`, e não só a
-- transição de status: com múltiplas políticas permissivas de UPDATE na
-- mesma tabela, o Postgres combina cada `using` com OR entre si e cada
-- `with check` com OR entre si, **independentemente** — não por política.
-- Sem repetir a posse aqui, a concreteira passaria no `using` da política
-- anterior (dona da entrega, ainda 'declarada') e teria a mudança aprovada
-- por este `with check`, que sozinho não checa quem está fazendo o update.
create policy "entregas_concreto: construtora valida ou contesta" on entregas_concreto
  for update
  using (
    exists (select 1 from obras where obras.id = entregas_concreto.obra_id and obras.construtora_id = current_construtora_id())
  )
  with check (
    exists (select 1 from obras where obras.id = entregas_concreto.obra_id and obras.construtora_id = current_construtora_id())
    and status in ('validada', 'contestada')
  );

-- ---------- entrega_composicao ----------

create policy "entrega_composicao: escopo da entrega" on entrega_composicao
  for select
  using (
    exists (
      select 1 from entregas_concreto e
      where e.id = entrega_composicao.entrega_id
        and (e.concreteira_id = current_concreteira_id()
             or exists (select 1 from obras where obras.id = e.obra_id and obras.construtora_id = current_construtora_id()))
    ) or is_admin()
  );

create policy "entrega_composicao: concreteira lança na própria entrega" on entrega_composicao
  for insert
  with check (
    exists (
      select 1 from entregas_concreto e
      where e.id = entrega_id
        and e.concreteira_id = current_concreteira_id()
        and e.status = 'declarada'
    )
  );

create policy "entrega_composicao: concreteira remove enquanto declarada" on entrega_composicao
  for delete
  using (
    exists (
      select 1 from entregas_concreto e
      where e.id = entrega_composicao.entrega_id
        and e.concreteira_id = current_concreteira_id()
        and e.status = 'declarada'
    )
  );
