-- Concreteira: a empresa entre a fábrica de cimento e a construtora, que
-- acrescenta agregados/aditivos ao cimento "limpo" para formar o concreto
-- entregue na obra. Ganha tenant e portal próprios, no mesmo espírito de
-- `construtoras` — catálogo global, com vínculo explícito por obra (uma
-- concreteira atende várias construtoras/obras ao mesmo tempo).
--
-- O primeiro usuário de uma concreteira nova é provisionado manualmente,
-- igual hoje acontece com o primeiro usuário de uma construtora — nenhum
-- app do monorepo cria `auth.users`/`perfis` programaticamente ainda.

create table concreteiras (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table perfis add column concreteira_id uuid references concreteiras (id);

-- ---------- perfis.papel: acrescenta o papel sem lançador/RT ----------
-- Diferente de construtora, não há separação entre "lança dado" e "assina
-- dossiê" aqui — a concreteira ainda não tem um documento formal que exija
-- essa segregação (ver seção 5.3 do plano). Um papel único cobre o portal.

alter table perfis drop constraint perfis_papel_check;
alter table perfis add constraint perfis_papel_check check (
  papel in (
    'prefeitura_analista',
    'prefeitura_gestor',
    'construtora_lancador',
    'construtora_rt',
    'fiscal',
    'concreteira',
    'admin_plataforma'
  )
);

alter table perfis drop constraint perfil_tenant_coerente;
alter table perfis add constraint perfil_tenant_coerente check (
  (papel like 'prefeitura_%' and municipio_id is not null and construtora_id is null and concreteira_id is null)
  or (papel like 'construtora_%' and construtora_id is not null and municipio_id is null and concreteira_id is null)
  or (papel = 'fiscal' and municipio_id is not null and construtora_id is null and concreteira_id is null)
  or (papel = 'concreteira' and concreteira_id is not null and municipio_id is null and construtora_id is null)
  or (papel = 'admin_plataforma')
);

-- ---------- vínculo obra × concreteira ----------
-- A construtora cria o vínculo (convida/vincula a concreteira à obra dela).
-- `status` fica pronto para a concreteira encerrar o fornecimento no futuro;
-- por ora toda linha nasce e permanece 'ativo' via UI.

create table obra_concreteiras (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id),
  concreteira_id uuid not null references concreteiras (id),
  status text not null default 'ativo' check (status in ('convidado', 'ativo', 'encerrado')),
  convidado_por uuid references perfis (id),
  created_at timestamptz not null default now(),
  unique (obra_id, concreteira_id)
);
create index obra_concreteiras_obra_idx on obra_concreteiras (obra_id);
create index obra_concreteiras_concreteira_idx on obra_concreteiras (concreteira_id);

alter table concreteiras enable row level security;
alter table obra_concreteiras enable row level security;

-- ---------- helpers ----------

create or replace function current_concreteira_id()
returns uuid language sql stable security definer set search_path = public as $$
  select concreteira_id from perfis where id = auth.uid();
$$;

-- Igual a `fiscal_designado_na_obra` (migration 22): função security definer
-- sem parâmetro de usuário, para poder ser usada pela política de `obras`
-- sem criar um ciclo `obras ↔ obra_concreteiras`.
create or replace function concreteira_vinculada_na_obra(p_obra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from obra_concreteiras
    where obra_id = p_obra_id
      and concreteira_id = current_concreteira_id()
      and status = 'ativo'
  );
$$;

revoke execute on function concreteira_vinculada_na_obra(uuid) from public;
grant execute on function concreteira_vinculada_na_obra(uuid) to authenticated;

-- Reaproveitada pelas migrations seguintes (entregas, ESG) para checar se a
-- construtora tem algum vínculo ativo com a concreteira, sem repetir o join.
create or replace function construtora_vinculada_a_concreteira(p_concreteira_id uuid)
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
      and o.construtora_id = current_construtora_id()
      and oc.status = 'ativo'
  );
$$;

revoke execute on function construtora_vinculada_a_concreteira(uuid) from public;
grant execute on function construtora_vinculada_a_concreteira(uuid) to authenticated;

-- ---------- obras: concreteira vê as que atende ----------

create policy "obras: concreteira vê as vinculadas" on obras
  for select
  using (concreteira_vinculada_na_obra(id));

-- ---------- concreteiras ----------

create policy "concreteiras: vê a própria" on concreteiras
  for select using (id = current_concreteira_id() or is_admin());

create policy "concreteiras: construtora vê as que vinculou" on concreteiras
  for select using (construtora_vinculada_a_concreteira(id));

create policy "concreteiras: construtora cadastra" on concreteiras
  for insert with check (current_papel() in ('construtora_lancador', 'construtora_rt'));

-- ---------- obra_concreteiras ----------

create policy "obra_concreteiras: construtora vê as próprias obras" on obra_concreteiras
  for select using (
    exists (select 1 from obras where obras.id = obra_concreteiras.obra_id and obras.construtora_id = current_construtora_id())
  );

create policy "obra_concreteiras: concreteira vê os próprios vínculos" on obra_concreteiras
  for select using (concreteira_id = current_concreteira_id());

create policy "obra_concreteiras: construtora vincula na própria obra" on obra_concreteiras
  for insert with check (
    convidado_por = auth.uid()
    and current_papel() in ('construtora_lancador', 'construtora_rt')
    and exists (select 1 from obras where obras.id = obra_id and obras.construtora_id = current_construtora_id())
  );
