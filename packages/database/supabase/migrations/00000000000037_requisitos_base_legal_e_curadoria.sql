-- Base legal no catálogo auditável, e o direito de corrigi-lo.
--
-- DOIS PROBLEMAS, UMA CAUSA
--
-- 1. `requisitos_auditoria` diz O QUE a prefeitura audita, qual a evidência
--    primária e qual o teste de verificação — mas não diz sob QUAL NORMA. O
--    analista abre o catálogo e não vê o fundamento do que está exigindo. A
--    base legal existe hoje só em `apps/obra/src/lib/roteiros-ativo.ts`, e só
--    para 4 dos 8 requisitos ativos: MAD, CRV, EFI e AGU não têm norma escrita
--    em lugar nenhum do sistema.
--
-- 2. A tabela era append-only por acidente. Havia INSERT (admin e gestor) e
--    SELECT, e mais nada — nenhum UPDATE, nenhum DELETE. A prefeitura podia
--    criar item de catálogo e nunca corrigir nem remover. Um erro de digitação
--    no nome de um requisito era permanente; requisito revogado por mudança de
--    norma ficava para sempre. Foi assim que um "Requisito de teste (apagar)"
--    passou dois meses em produção e teve de sair por SQL direto, fora do app.
--
-- Os dois andam juntos: norma muda, e uma coluna de base legal num catálogo
-- que ninguém pode editar nasce desatualizada.
--
-- POR QUE JSONB, E NÃO TEXT
-- Requisito real cita mais de uma norma. O RCC se apoia em três (CONAMA
-- 307/2002, Lei 12.305/2010 e o PGRCC do licenciamento), cada uma exigindo uma
-- coisa diferente. Espremer isso num text vira parágrafo corrido que ninguém
-- consegue renderizar por norma nem conferir item a item. A forma é a mesma que
-- `roteiros-ativo.ts` já usa — [{norma, oQueExige}] — para que os dois lados
-- falem a mesma língua quando forem reconciliados.
--
-- Fica NULLABLE de propósito, com default '[]': as 19 linhas em produção não
-- têm base legal hoje, e um NOT NULL obrigaria a inventar norma para preencher.
-- Vazio é o estado honesto de "ainda não citada".

alter table requisitos_auditoria
  add column base_legal jsonb not null default '[]';

comment on column requisitos_auditoria.base_legal is
  'Normas que fundamentam o requisito: [{"norma": "...", "oQueExige": "..."}]. '
  'Vazio significa não citada ainda, não "sem fundamento legal".';

-- ---------- curadoria: corrigir e remover ----------

-- Mesmo recorte do INSERT da migration 13: curadoria de catálogo é decisão de
-- política municipal, então prefeitura_gestor; analista segue só leitura.
create policy "requisitos_auditoria: gestor corrige" on requisitos_auditoria
  for update
  using (current_papel() = 'prefeitura_gestor')
  with check (current_papel() = 'prefeitura_gestor');

create policy "requisitos_auditoria: admin corrige" on requisitos_auditoria
  for update
  using (is_admin())
  with check (is_admin());

-- DELETE é mais restrito que UPDATE de propósito. Requisito já usado por um
-- projeto ESG não pode sumir: `projetos_esg.requisito_id` referencia esta
-- tabela, e apagar a linha ou quebraria a FK ou apagaria o fundamento de um
-- processo que a prefeitura já analisou. Requisito que envelheceu e não pode
-- ser removido deve ser corrigido por UPDATE — a saída é editar, não excluir.
create policy "requisitos_auditoria: gestor remove os não usados" on requisitos_auditoria
  for delete
  using (
    current_papel() = 'prefeitura_gestor'
    and not exists (
      select 1 from projetos_esg
      where projetos_esg.requisito_id = requisitos_auditoria.id
    )
  );

create policy "requisitos_auditoria: admin remove os não usados" on requisitos_auditoria
  for delete
  using (
    is_admin()
    and not exists (
      select 1 from projetos_esg
      where projetos_esg.requisito_id = requisitos_auditoria.id
    )
  );

-- A subconsulta das policies de DELETE roda por linha avaliada; sem índice em
-- `projetos_esg.requisito_id` seria seq scan a cada uma.
create index if not exists projetos_esg_requisito_idx on projetos_esg (requisito_id);
