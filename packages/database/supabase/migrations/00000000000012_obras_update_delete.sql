-- Faltava editar/excluir obra — só existia INSERT pra prefeitura. UPDATE
-- é ação administrativa (gestor e analista, seção 06 do plano); DELETE
-- fica restrito a prefeitura_gestor por ser mais destrutivo. Obras com
-- inventário/fiscalização/selo vinculado continuam protegidas pelas FKs
-- (sem ON DELETE CASCADE) — o DELETE só funciona em obra "vazia".

create policy "obras: prefeitura edita no próprio município" on obras
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  )
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  );

create policy "obras: gestor exclui no próprio município" on obras
  for delete
  using (
    current_papel() = 'prefeitura_gestor'
    and municipio_id = current_municipio_id()
  );
