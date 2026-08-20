-- Prepara o mapa territorial: precisa do código IBGE do município pra
-- buscar o contorno na Malhas API (servicodados.ibge.gov.br) e pra filtrar
-- camadas nacionais/estaduais (ex.: SICAR) por município.
--
-- Aproveita pra cadastrar Palhoça e São José/SC, que ainda não existiam —
-- só Florianópolis tinha sido semeada (packages/database/scripts/seed.mjs).
-- Cadastro básico só (nome/UF/código); CNPJ e régua de faixa ficam pra
-- quando alguém dessas prefeituras entrar de verdade no sistema.

alter table municipios add column codigo_ibge text;

update municipios set codigo_ibge = '4205407' where nome = 'Florianópolis';

insert into municipios (nome, uf, codigo_ibge)
values
  ('Palhoça', 'SC', '4211900'),
  ('São José', 'SC', '4216602');
