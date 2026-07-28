-- CarbonFree Obras — Row Level Security
-- Perfis com RLS no banco, não apenas na interface (seção 5.3).

alter table municipios enable row level security;
alter table construtoras enable row level security;
alter table perfis enable row level security;
alter table obras enable row level security;
alter table inventarios enable row level security;
alter table fatores_emissao enable row level security;
alter table evidencias enable row level security;
alter table lancamentos enable row level security;
alter table acoes_remocao enable row level security;
alter table mudas enable row level security;
alter table creditos_retirados enable row level security;
alter table fiscalizacoes enable row level security;
alter table autos enable row level security;
alter table selos enable row level security;
alter table trilha_auditoria enable row level security;

-- ---------- helpers: leem o perfil do usuário autenticado uma única vez ----------

create or replace function current_papel()
returns text language sql stable security definer set search_path = public as $$
  select papel from perfis where id = auth.uid();
$$;

create or replace function current_municipio_id()
returns uuid language sql stable security definer set search_path = public as $$
  select municipio_id from perfis where id = auth.uid();
$$;

create or replace function current_construtora_id()
returns uuid language sql stable security definer set search_path = public as $$
  select construtora_id from perfis where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select current_papel() = 'admin_plataforma';
$$;

-- ---------- perfis ----------

create policy "perfis: vê o próprio" on perfis
  for select using (id = auth.uid() or is_admin());

-- ---------- municipios ----------

create policy "municipios: membros do tenant" on municipios
  for select using (id = current_municipio_id() or is_admin());

create policy "municipios: gestor edita o próprio" on municipios
  for update using (id = current_municipio_id() and current_papel() = 'prefeitura_gestor');

-- ---------- construtoras ----------

create policy "construtoras: membros do tenant" on construtoras
  for select using (id = current_construtora_id() or is_admin());

create policy "construtoras: prefeitura vê construtoras com obra no município" on construtoras
  for select using (
    exists (
      select 1 from obras
      where obras.construtora_id = construtoras.id
        and obras.municipio_id = current_municipio_id()
    )
  );

-- ---------- obras ----------

create policy "obras: construtora vê as próprias" on obras
  for select using (construtora_id = current_construtora_id());

create policy "obras: construtora edita as próprias" on obras
  for insert with check (construtora_id = current_construtora_id());

create policy "obras: construtora atualiza as próprias" on obras
  for update using (construtora_id = current_construtora_id());

create policy "obras: prefeitura vê as do município" on obras
  for select using (municipio_id = current_municipio_id() or is_admin());

-- ---------- fatores_emissao (referência pública, escrita restrita) ----------

create policy "fatores: leitura autenticada" on fatores_emissao
  for select using (auth.role() = 'authenticated');

create policy "fatores: escrita só admin" on fatores_emissao
  for insert with check (is_admin());

-- ---------- entidades filhas de obras: mesmo escopo da obra ----------

create policy "inventarios: escopo da obra" on inventarios
  for select using (
    exists (
      select 1 from obras
      where obras.id = inventarios.obra_id
        and (obras.construtora_id = current_construtora_id()
             or obras.municipio_id = current_municipio_id())
    ) or is_admin()
  );

create policy "evidencias: escopo da obra" on evidencias
  for select using (
    exists (
      select 1 from obras
      where obras.id = evidencias.obra_id
        and (obras.construtora_id = current_construtora_id()
             or obras.municipio_id = current_municipio_id())
    ) or is_admin()
  );

create policy "lancamentos: escopo via inventário" on lancamentos
  for select using (
    exists (
      select 1 from inventarios
      join obras on obras.id = inventarios.obra_id
      where inventarios.id = lancamentos.inventario_id
        and (obras.construtora_id = current_construtora_id()
             or obras.municipio_id = current_municipio_id())
    ) or is_admin()
  );

create policy "acoes_remocao: escopo via lançamento" on acoes_remocao
  for select using (
    exists (
      select 1 from lancamentos
      join inventarios on inventarios.id = lancamentos.inventario_id
      join obras on obras.id = inventarios.obra_id
      where lancamentos.id = acoes_remocao.lancamento_id
        and (obras.construtora_id = current_construtora_id()
             or obras.municipio_id = current_municipio_id())
    ) or is_admin()
  );

create policy "mudas: escopo via ação de remoção" on mudas
  for select using (
    exists (
      select 1 from acoes_remocao
      join lancamentos on lancamentos.id = acoes_remocao.lancamento_id
      join inventarios on inventarios.id = lancamentos.inventario_id
      join obras on obras.id = inventarios.obra_id
      where acoes_remocao.id = mudas.acao_remocao_id
        and (obras.construtora_id = current_construtora_id()
             or obras.municipio_id = current_municipio_id())
    ) or is_admin()
  );

create policy "creditos_retirados: escopo via ação de remoção" on creditos_retirados
  for select using (
    exists (
      select 1 from acoes_remocao
      join lancamentos on lancamentos.id = acoes_remocao.lancamento_id
      join inventarios on inventarios.id = lancamentos.inventario_id
      join obras on obras.id = inventarios.obra_id
      where acoes_remocao.id = creditos_retirados.acao_remocao_id
        and (obras.construtora_id = current_construtora_id()
             or obras.municipio_id = current_municipio_id())
    ) or is_admin()
  );

-- ---------- fiscalização ----------

create policy "fiscalizacoes: fiscal vê as próprias" on fiscalizacoes
  for select using (fiscal_id = auth.uid());

create policy "fiscalizacoes: prefeitura vê as do município" on fiscalizacoes
  for select using (
    exists (select 1 from obras where obras.id = fiscalizacoes.obra_id and obras.municipio_id = current_municipio_id())
    or is_admin()
  );

create policy "fiscalizacoes: construtora vê as da própria obra" on fiscalizacoes
  for select using (
    exists (select 1 from obras where obras.id = fiscalizacoes.obra_id and obras.construtora_id = current_construtora_id())
  );

-- Fiscal de campo não edita lançamento — só registra constatação (seção 5.3).
create policy "fiscalizacoes: só fiscal designado insere constatação" on fiscalizacoes
  for update using (fiscal_id = auth.uid())
  with check (fiscal_id = auth.uid());

create policy "autos: mesmo escopo da fiscalização" on autos
  for select using (
    exists (
      select 1 from fiscalizacoes
      join obras on obras.id = fiscalizacoes.obra_id
      where fiscalizacoes.id = autos.fiscalizacao_id
        and (obras.municipio_id = current_municipio_id()
             or obras.construtora_id = current_construtora_id())
    ) or is_admin()
  );

-- Quem analisa ≠ quem homologa: só prefeitura_gestor assina/emite selo.
create policy "selos: leitura por escopo da obra" on selos
  for select using (
    exists (select 1 from obras where obras.id = selos.obra_id
      and (obras.municipio_id = current_municipio_id() or obras.construtora_id = current_construtora_id()))
    or is_admin()
  );

create policy "selos: só gestor homologa" on selos
  for insert with check (current_papel() = 'prefeitura_gestor');

-- ---------- trilha de auditoria: leitura restrita a quem gere o programa ----------

create policy "trilha: leitura por gestor do tenant ou admin" on trilha_auditoria
  for select using (current_papel() in ('prefeitura_gestor', 'admin_plataforma'));

-- gravação da trilha é feita via trigger com security definer, nunca por INSERT direto do cliente
