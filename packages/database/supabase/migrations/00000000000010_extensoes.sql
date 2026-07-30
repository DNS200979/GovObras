-- Habilita PostGIS, pg_cron e pgvector no schema `extensions` (padrão
-- recomendado pela Supabase — evita poluir o `public`).
--
-- PostGIS: consultas geoespaciais de verdade sobre obras.coordenadas,
--   mudas.coordenadas e fiscalizacoes.coordenada_execucao (hoje `point`
--   puro do Postgres — migrar essas colunas pra geography(Point,4326) é
--   um passo separado, não incluído aqui).
-- pg_cron: tarefas agendadas no banco (ex.: cobrar checkpoint de
--   sobrevivência de mudas em 12/24/36 meses).
-- pgvector: tipo vector para embeddings, caso entre busca semântica.

create extension if not exists postgis with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists vector with schema extensions;
