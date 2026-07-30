-- Catálogo dos requisitos auditáveis da obra (plano de negócio, seção 05):
-- "o que exatamente o fiscal pode checar e contestar?" — referência global,
-- não escopada por obra, igual fatores_emissao/alternativas_material.

create table requisitos_auditoria (
  id uuid primary key default gen_random_uuid(),
  natureza text not null check (natureza in ('passivo', 'ativo')),
  codigo text not null,              -- módulo EN 15978 (A1-A3, A4, A5, USO, B1) no passivo;
                                      -- tag da ação (SUB, RCC, ENE, ARB, MAD, CRV, EFI, AGU) no ativo
  requisito text not null,
  unidade text not null,
  evidencia_primaria text not null,
  teste_verificacao text not null,
  ordem smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table requisitos_auditoria enable row level security;

create policy "requisitos_auditoria: leitura autenticada" on requisitos_auditoria
  for select to authenticated using (true);

create policy "requisitos_auditoria: escrita só admin" on requisitos_auditoria
  for insert with check (is_admin());
