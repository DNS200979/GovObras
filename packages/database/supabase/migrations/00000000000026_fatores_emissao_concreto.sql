-- Catálogo de fatores só tinha cimento e aço — nada pro que a concreteira
-- de fato acrescenta ao cimento (agregados, aditivos), que é o que o
-- submódulo de concreteiras precisa pra materializar entrega em lançamento.
--
-- Valores abaixo são estimativas ilustrativas (ordem de grandeza plausível
-- pra cada categoria), NÃO laudos DAP auditados — servem pra destravar o
-- cálculo fim-a-fim. Trocar por DAP real do fornecedor antes de qualquer
-- lançamento valer pra homologação de verdade.

insert into fatores_emissao (categoria, valor, unidade, fonte, ano_base, vigencia_inicio) values
  ('brita_1', 0.006000, 'tCO2e/t', 'Estimativa ilustrativa — substituir por DAP do fornecedor', 2024, '2024-01-01'),
  ('areia_media', 0.002600, 'tCO2e/t', 'Estimativa ilustrativa — substituir por DAP do fornecedor', 2024, '2024-01-01'),
  ('aditivo_plastificante', 0.900000, 'tCO2e/t', 'Estimativa ilustrativa — substituir por DAP do fornecedor', 2024, '2024-01-01'),
  ('cinza_volante', 0.010000, 'tCO2e/t', 'Estimativa ilustrativa — substituir por DAP do fornecedor', 2024, '2024-01-01');
