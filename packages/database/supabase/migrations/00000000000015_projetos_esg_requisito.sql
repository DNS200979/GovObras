-- Vincula (opcionalmente) um projeto ESG a um requisito auditável já
-- cadastrado pela prefeitura — ajuda o revisor a entender a qual item do
-- checklist passivo/ativo o projeto se refere.

alter table projetos_esg
  add column requisito_id uuid references requisitos_auditoria (id);

create index projetos_esg_requisito_idx on projetos_esg (requisito_id);
