-- Catálogo de alternativas de material para o Simulador de decisão
-- (seção 07 do plano — "a tela que a construtora usa antes de comprar").
-- Referência global, não escopada por obra, no mesmo espírito de
-- fatores_emissao.

create table alternativas_material (
  id uuid primary key default gen_random_uuid(),
  material text not null,
  material_original text not null,
  unidade text not null,
  custo_adicional_por_unidade numeric(14,2) not null,
  tco2e_evitado_por_unidade numeric(14,6) not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table alternativas_material enable row level security;

create policy "alternativas_material: leitura autenticada" on alternativas_material
  for select using (auth.role() = 'authenticated');

create policy "alternativas_material: escrita só admin" on alternativas_material
  for insert with check (is_admin());
