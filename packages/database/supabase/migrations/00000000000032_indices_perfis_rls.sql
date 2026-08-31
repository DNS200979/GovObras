-- Índices nas três FKs de `perfis` que a RLS consulta em toda requisição.
--
-- `current_municipio_id()`, `current_construtora_id()` e
-- `current_concreteira_id()` fazem `select <coluna> from perfis where id =
-- auth.uid()`. Essas funções são chamadas por praticamente toda policy do
-- schema — ou seja, cada checagem de acesso do sistema passa por aqui.
--
-- O lookup é por `id` (que já é PK), então o ganho direto é menor do que
-- parece; o que estes índices resolvem são os caminhos inversos, que hoje
-- fazem varredura sequencial:
--   - "quais perfis pertencem a este município"  → policy de listagem de
--     fiscais no agendamento (`perfis: prefeitura vê fiscais do próprio
--     município`), que filtra por municipio_id;
--   - as verificações de integridade referencial ao apagar/alterar
--     município, construtora ou concreteira, que sem índice varrem `perfis`.
--
-- Mudança puramente aditiva: não altera nenhuma policy nem quem enxerga o quê.

create index if not exists perfis_municipio_idx on perfis (municipio_id);
create index if not exists perfis_construtora_idx on perfis (construtora_id);
create index if not exists perfis_concreteira_idx on perfis (concreteira_id);
